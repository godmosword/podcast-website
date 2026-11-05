import { execFileSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const SCRIPT = join(process.cwd(), "scripts/ci/checkout-sync-base.sh");

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "t",
      GIT_AUTHOR_EMAIL: "t@example.com",
      GIT_COMMITTER_NAME: "t",
      GIT_COMMITTER_EMAIL: "t@example.com",
    },
  }).trim();
}

const roots: string[] = [];

/** 假的 remote：main 往前走了（squash），sync/apple 還停在舊歷史。 */
function setup(): { work: string; bin: string; lease: string; mainSha: string; syncSha: string } {
  const root = mkdtempSync(join(tmpdir(), "sync-base-"));
  roots.push(root);
  const remote = join(root, "remote.git");
  const work = join(root, "work");
  const bin = join(root, "bin");
  mkdirSync(bin);
  git(root, "init", "-q", "--bare", "-b", "main", remote);
  git(root, "clone", "-q", remote, work);
  git(work, "checkout", "-q", "-B", "main");
  // 測試會把腳本複製進來：不算工作區改動。
  writeFileSync(join(work, ".git/info/exclude"), "scripts/\n");
  writeFileSync(join(work, "a.txt"), "1");
  git(work, "add", "a.txt");
  git(work, "commit", "-qm", "base");
  git(work, "push", "-q", "origin", "main");
  git(work, "checkout", "-qb", "sync/apple");
  writeFileSync(join(work, "s.txt"), "sync");
  git(work, "add", "s.txt");
  git(work, "commit", "-qm", "sync");
  git(work, "push", "-q", "origin", "sync/apple");
  const syncSha = git(work, "rev-parse", "HEAD");
  git(work, "checkout", "-q", "main");
  writeFileSync(join(work, "s.txt"), "squashed");
  git(work, "add", "s.txt");
  git(work, "commit", "-qm", "squash");
  git(work, "push", "-q", "origin", "main");
  const mainSha = git(work, "rev-parse", "HEAD");
  return { work, bin, lease: join(root, "lease"), mainSha, syncSha };
}

function run(ctx: ReturnType<typeof setup>, openPrs: string, ghExit = 0): void {
  writeFileSync(join(ctx.bin, "gh"), `#!/usr/bin/env bash\necho "${openPrs}"\nexit ${ghExit}\n`);
  chmodSync(join(ctx.bin, "gh"), 0o755);
  // 腳本會 cd 到自己上兩層：一定要複製進暫存 repo 再跑，不然切的是真正的工作目錄。
  const copy = join(ctx.work, "scripts/ci/checkout-sync-base.sh");
  mkdirSync(join(ctx.work, "scripts/ci"), { recursive: true });
  copyFileSync(SCRIPT, copy);
  execFileSync("bash", [copy], {
    cwd: ctx.work,
    stdio: "pipe",
    env: {
      ...process.env,
      PATH: `${ctx.bin}:${process.env.PATH}`,
      SYNC_BRANCH_LEASE_FILE: ctx.lease,
    },
  });
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

/** 轉錄途中 PR 被合併：工作區有字幕改動，HEAD 還在舊 tip 上。 */
function runRebaseGuard(ctx: ReturnType<typeof setup>, openPrs: string): void {
  writeFileSync(join(ctx.bin, "gh"), `#!/usr/bin/env bash\necho "${openPrs}"\n`);
  chmodSync(join(ctx.bin, "gh"), 0o755);
  const copy = join(ctx.work, "scripts/ci/rebase-sync-if-merged.sh");
  mkdirSync(join(ctx.work, "scripts/ci"), { recursive: true });
  copyFileSync(join(process.cwd(), "scripts/ci/rebase-sync-if-merged.sh"), copy);
  execFileSync("bash", [copy], {
    cwd: ctx.work,
    stdio: "pipe",
    env: { ...process.env, PATH: `${ctx.bin}:${process.env.PATH}` },
  });
}

describe("rebase-sync-if-merged.sh", () => {
  function onStaleTip(ctx: ReturnType<typeof setup>): void {
    git(ctx.work, "checkout", "-q", "-B", "sync/apple", "origin/sync/apple");
    writeFileSync(join(ctx.work, "sub.json"), "subtitles");
  }

  it("轉錄途中 PR 合併了（沒有開著的 PR、HEAD 有 main 沒有的 commit）：把字幕搬到 main 上", () => {
    const ctx = setup();
    onStaleTip(ctx);
    runRebaseGuard(ctx, "0");
    expect(git(ctx.work, "rev-parse", "HEAD")).toBe(ctx.mainSha);
    expect(readFileSync(join(ctx.work, "sub.json"), "utf8")).toBe("subtitles");
  });

  it("PR 還開著：不動，繼續接在分支後面", () => {
    const ctx = setup();
    onStaleTip(ctx);
    runRebaseGuard(ctx, "1");
    expect(git(ctx.work, "rev-parse", "HEAD")).toBe(ctx.syncSha);
    expect(readFileSync(join(ctx.work, "sub.json"), "utf8")).toBe("subtitles");
  });

  it("本來就從 main 開始：不動", () => {
    const ctx = setup();
    git(ctx.work, "checkout", "-q", "-B", "sync/apple", "origin/main");
    writeFileSync(join(ctx.work, "sub.json"), "subtitles");
    runRebaseGuard(ctx, "0");
    expect(git(ctx.work, "rev-parse", "HEAD")).toBe(ctx.mainSha);
  });

  it("沒有改動（這輪沒有要補的字幕）：不動，也不查 PR", () => {
    const ctx = setup();
    git(ctx.work, "checkout", "-q", "-B", "sync/apple", "origin/sync/apple");
    runRebaseGuard(ctx, "0");
    expect(git(ctx.work, "rev-parse", "HEAD")).toBe(ctx.syncSha);
  });
});

describe("checkout-sync-base.sh", () => {
  it("有開著的 sync PR：接在分支後面，不蓋掉還沒進 main 的新集", () => {
    const ctx = setup();
    run(ctx, "1");
    expect(git(ctx.work, "rev-parse", "HEAD")).toBe(ctx.syncSha);
    expect(readFileSync(ctx.lease, "utf8").trim()).toBe(ctx.syncSha);
  });

  it("分支還在、但 PR 已經合併（沒有開著的）：從 main 開始，不接舊歷史；lease 仍記遠端 SHA", () => {
    const ctx = setup();
    run(ctx, "0");
    expect(git(ctx.work, "rev-parse", "HEAD")).toBe(ctx.mainSha);
    expect(git(ctx.work, "rev-parse", "--abbrev-ref", "HEAD")).toBe("sync/apple");
    expect(readFileSync(ctx.lease, "utf8").trim()).toBe(ctx.syncSha);
  });

  it("查不到 PR 狀態：直接失敗，不亂猜基底", () => {
    const ctx = setup();
    expect(() => run(ctx, "", 1)).toThrow();
  });
});
