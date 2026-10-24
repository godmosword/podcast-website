import { execFileSync, spawn, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const SCRIPT = path.join(process.cwd(), "scripts/agent-review.sh");

/** 假的審查者：把收到的參數寫進 log，印一行固定回覆；FAKE_SLEEP 秒數用來模擬卡住。 */
function fakeReviewer(dir: string, name: string): void {
  const file = path.join(dir, name);
  writeFileSync(
    file,
    [
      "#!/usr/bin/env bash",
      `printf '%s\\n' "${name} $*" >> "${path.join(dir, "calls.log")}"`,
      // 模擬審查者自己開的子程序：2 秒後留下記號；逾時應該連它一起收掉。
      'if [ -n "${FAKE_GRANDCHILD:-}" ]; then (sleep 2; touch "$FAKE_GRANDCHILD") & fi',
      'if [ -n "${FAKE_SLEEP:-}" ]; then sleep "$FAKE_SLEEP"; fi',
      `echo "review from ${name}"`,
    ].join("\n"),
  );
  chmodSync(file, 0o755);
}

describe("scripts/agent-review.sh", () => {
  let dir: string;
  let prompt: string;
  let out: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "agent-review-"));
    for (const name of ["codex", "cursor-agent", "grok"]) fakeReviewer(dir, name);
    // 假的 caffeinate：記下自己被叫到，再把 -i 之後的命令原樣執行。
    const caffeinate = path.join(dir, "caffeinate");
    writeFileSync(
      caffeinate,
      `#!/usr/bin/env bash\nprintf '%s\\n' "caffeinate $1" >> "${path.join(dir, "calls.log")}"\nshift\nexec "$@"\n`,
    );
    chmodSync(caffeinate, 0o755);
    prompt = path.join(dir, "prompt.md");
    writeFileSync(prompt, "Review the diff at /tmp/x.diff. Do not explore the repo.");
    out = path.join(dir, "review.md");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(args: string[], env: NodeJS.ProcessEnv = {}): number {
    const result = spawnSync("bash", [SCRIPT, ...args], {
      encoding: "utf8",
      env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ""}`, ...env },
    });
    return result.status ?? 1;
  }

  function calls(): string[] {
    return readFileSync(path.join(dir, "calls.log"), "utf8").trim().split("\n");
  }

  it("工程審：codex 唯讀、關 stdin，輸出、stderr、結束碼各寫一個檔", () => {
    expect(run(["engineering", prompt, out])).toBe(0);
    expect(readFileSync(out, "utf8")).toContain("review from codex");
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("0");
    expect(existsSync(`${out}.err`)).toBe(true);
    const call = calls().find((line) => line.startsWith("codex "));
    expect(call).toContain(
      "codex exec -m gpt-6-luna -s read-only -c model_reasoning_effort=medium Review the diff",
    );
  });

  it("對抗審：cursor-agent 用 ask 模式", () => {
    expect(run(["adversarial", prompt, out])).toBe(0);
    expect(calls().find((line) => line.startsWith("cursor-agent "))).toContain(
      "cursor-agent -p --trust --mode ask --model grok-4.7-high-fast Review the diff",
    );
  });

  it("grok 備援：plan 模式、限回合數、關網路搜尋，不讓它無限讀檔", () => {
    expect(run(["adversarial-grok", prompt, out], { AGENT_REVIEW_MAX_TURNS: "25" })).toBe(0);
    const call = calls().find((line) => line.startsWith("grok "));
    expect(call).toContain("grok -m grok-4.7 --permission-mode plan");
    expect(call).toContain("--max-turns 25");
    expect(call).toContain("--disable-web-search");
    expect(call).toContain("--output-format plain");
    expect(call).toContain("-p Review the diff");
  });

  it("有 caffeinate 就用 -i 包住，審查期間 Mac 不會閒置睡眠", () => {
    expect(run(["engineering", prompt, out])).toBe(0);
    expect(calls()[0]).toBe("caffeinate -i");
  });

  it("卡住就在時間上限結束，結束碼 124", () => {
    const started = Date.now();
    const status = run(["engineering", prompt, out], {
      AGENT_REVIEW_TIMEOUT: "1",
      FAKE_SLEEP: "30",
    });
    expect(status).toBe(124);
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("124");
    expect(Date.now() - started).toBeLessThan(15_000);
  });

  it("--detach 立刻返回，跑完才寫 .done，session 重啟也不會被砍", () => {
    const started = Date.now();
    expect(run(["--detach", "engineering", prompt, out], { FAKE_SLEEP: "1" })).toBe(0);
    expect(Date.now() - started).toBeLessThan(900);
    expect(existsSync(`${out}.done`)).toBe(false);
    execFileSync("bash", ["-c", `for i in $(seq 1 100); do [ -f "${out}.done" ] && exit 0; sleep 0.1; done; exit 1`]);
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("0");
    expect(readFileSync(out, "utf8")).toContain("review from codex");
  });

  it.each(["timeout", "perl"])("逾時連審查者開的子程序一起收掉（%s）", (impl) => {
    const marker = path.join(dir, "grandchild-survived");
    const status = run(["engineering", prompt, out], {
      AGENT_REVIEW_TIMEOUT: "1",
      AGENT_REVIEW_TIMEOUT_IMPL: impl,
      FAKE_SLEEP: "30",
      FAKE_GRANDCHILD: marker,
    });
    expect(status).toBe(124);
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("124");
    execFileSync("sleep", ["3"]);
    expect(existsSync(marker), "子程序在逾時後還活著").toBe(false);
  });

  it("被 SIGTERM 中斷也寫 .done（143），等待的一方不會永遠等", async () => {
    const child = spawn("bash", [SCRIPT, "engineering", prompt, out], {
      env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ""}`, FAKE_SLEEP: "30" },
      stdio: "ignore",
    });
    await new Promise((resolve) => setTimeout(resolve, 800));
    child.kill("SIGTERM");
    await new Promise((resolve) => child.on("exit", resolve));
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("143");
  });

  it("--detach 的審查在自己的 session 裡，呼叫端整個程序群組被砍也活著", () => {
    // 模擬 Claude Code 收 session：呼叫端開新 session、叫 --detach、再對自己整個程序群組送 TERM。
    spawnSync(
      "perl",
      [
        "-MPOSIX",
        "-e",
        "POSIX::setsid(); exec @ARGV",
        "bash",
        "-c",
        `bash "${SCRIPT}" --detach engineering "${prompt}" "${out}"; sleep 0.3; kill -TERM 0`,
      ],
      { env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ""}`, FAKE_SLEEP: "1" } },
    );
    execFileSync("bash", ["-c", `for i in $(seq 1 100); do [ -f "${out}.done" ] && exit 0; sleep 0.1; done; exit 1`]);
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("0");
  });

  it.each([
    ["timeout", "script"],
    ["perl", "script"],
    ["timeout", "interactive"],
  ])("讀 /dev/tty 不會被 SIGTTIN 停住（%s，%s）", (impl, mode) => {
    // 假審查者直接開控制終端。timeout 若把命令放進背景程序群組，read 會被 SIGTTIN
    // 停住（ps stat 為 T），輸出停在 before-tty，結束碼 124。
    // interactive：從有 job control 的互動式 bash 下指令。wrapper 本身是非互動 bash，
    // 裡面的 & 不另開程序群組，審查者仍在終端的前景群組（2026-10-25 Codex 審查疑慮）。
    writeFileSync(
      path.join(dir, "codex"),
      [
        "#!/usr/bin/env bash",
        "echo before-tty",
        'if read -t 1 -r _ </dev/tty; then echo tty-line; else echo "tty-read-returned:$?"; fi',
      ].join("\n"),
    );
    chmodSync(path.join(dir, "codex"), 0o755);
    const py = path.join(dir, "pty-run.py");
    writeFileSync(
      py,
      [
        "import os, sys, time, fcntl, termios, shlex, select",
        "script, prompt, out, mode = sys.argv[1:5]",
        "master, slave = os.openpty()",
        "pid = os.fork()",
        "if pid == 0:",
        "    os.close(master)",
        "    os.setsid()",
        "    name = os.ttyname(slave)",
        "    os.close(slave)",
        "    fd = os.open(name, os.O_RDWR)",
        "    try:",
        "        fcntl.ioctl(fd, termios.TIOCSCTTY, 0)",
        "    except OSError:",
        "        pass",
        "    os.dup2(fd, 0)",
        "    os.dup2(fd, 1)",
        "    os.dup2(fd, 2)",
        "    if fd > 2:",
        "        os.close(fd)",
        "    if mode == 'interactive':",
        "        os.execvpe('bash', ['bash', '--norc', '--noprofile', '-i'], dict(os.environ, PS1='$ '))",
        "    os.execvpe('bash', ['bash', script, 'engineering', prompt, out], os.environ)",
        "os.close(slave)",
        "if mode == 'interactive':",
        "    time.sleep(0.5)",
        "    line = 'bash %s engineering %s %s; exit $?\\n' % (shlex.quote(script), shlex.quote(prompt), shlex.quote(out))",
        "    os.write(master, line.encode())",
        "deadline = time.time() + 15",
        "while time.time() < deadline:",
        "    wpid, status = os.waitpid(pid, os.WNOHANG)",
        "    if wpid:",
        "        if os.WIFEXITED(status):",
        "            sys.exit(os.WEXITSTATUS(status))",
        "        sys.exit(128 + os.WTERMSIG(status))",
        // 互動式 bash 會回顯指令與提示字元，要邊讀邊丟，不然它可能卡在寫終端。
        "    ready, _, _ = select.select([master], [], [], 0.05)",
        "    if ready:",
        "        try:",
        "            os.read(master, 4096)",
        "        except OSError:",
        "            pass",
        "os.kill(pid, 9)",
        "os.waitpid(pid, 0)",
        "sys.exit(99)",
      ].join("\n"),
    );
    const started = Date.now();
    const result = spawnSync("python3", [py, SCRIPT, prompt, out, mode], {
      encoding: "utf8",
      timeout: 20_000,
      env: {
        ...process.env,
        PATH: `${dir}:${process.env.PATH ?? ""}`,
        AGENT_REVIEW_TIMEOUT: "4",
        AGENT_REVIEW_KILL_AFTER: "1",
        AGENT_REVIEW_TIMEOUT_IMPL: impl,
      },
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(readFileSync(out, "utf8")).toContain("tty-read-returned:");
    expect(readFileSync(`${out}.done`, "utf8").trim()).toBe("0");
    expect(Date.now() - started).toBeLessThan(12_000);
  });

  it("角色打錯或少參數就失敗，不會靜默跑別的模型", () => {
    expect(run(["designer", prompt, out])).toBe(2);
    expect(run(["engineering", prompt])).toBe(2);
    expect(run(["engineering", path.join(dir, "missing.md"), out])).toBe(2);
  });
});
