import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * VIS-DEBT-3 契約：視覺 baseline 的**機械閘門**。
 *
 * 純文件規範擋不住——`docs/AGENT-DOMAIN.md` 的驗證矩陣早就有「視覺回歸（改樣式／版面時）」
 * 這一列，但 2026-08-25 重錄 baseline 後的 4 天內仍有約 20 個 UI commit 直接 ship，
 * 導致 44 張 baseline 全數過期（根因調查見 TODOS VIS-DEBT-3）。
 *
 * 因此改用 pre-push hook 硬擋。本測試守住這個閘門本身不被靜默拿掉：
 * 它是唯一會在 `npm test` / CI 裡跑到的地方（hook 本身只在本機 push 時執行）。
 */

const ROOT = join(import.meta.dirname, "..", "..");
const HOOK_PATH = join(ROOT, ".githooks", "pre-push");

describe("VIS-DEBT-3 視覺 baseline 閘門", () => {
  const hook = readFileSync(HOOK_PATH, "utf8");

  it("pre-push hook 存在且可執行", () => {
    const mode = statSync(HOOK_PATH).mode;
    // owner execute bit
    expect(mode & 0o100).toBe(0o100);
  });

  it("涵蓋 components／app 的 tsx／css 與 visual spec 本身", () => {
    expect(hook).toContain("^(components|app)/.*\\.(tsx|css)$");
    expect(hook).toContain("^e2e/visual\\.spec\\.ts$");
    expect(hook).toContain("^e2e/visual-helpers\\.ts$");
  });

  it("以「有 UI 變更但 snapshots 一張都沒動」為擋下條件", () => {
    expect(hook).toContain("^e2e/visual\\.spec\\.ts-snapshots/");
    expect(hook).toMatch(/exit 1/);
  });

  it("保留具名逃生門，且不是靜默通過", () => {
    // 逃生門必須是明確的環境變數，不得是「hook 不存在就跳過」這種靜默失效
    expect(hook).toContain("SKIP_VISUAL_GATE");
    expect(hook).toMatch(/npm run test:visual:trusted/);
  });

  it("package.json 的 prepare 會把 core.hooksPath 指到 .githooks", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as { scripts?: Record<string, string> };
    expect(pkg.scripts?.prepare).toBe("git config core.hooksPath .githooks");
  });

  it("驗證矩陣仍載明視覺回歸是本機 pre-push 工具、刻意不進 CI", () => {
    const domain = readFileSync(
      join(ROOT, "docs", "AGENT-DOMAIN.md"),
      "utf8",
    );
    expect(domain).toContain("test:visual:trusted");
    expect(domain).toContain("刻意不進 CI");
  });
});

/** 在暫存 repo 裡實際跑 hook：main 上有人重錄過 baseline，新分支只改 UI。 */
describe("VIS-DEBT-3 閘門：新分支只看從 main 分出來之後的 commit", () => {
  const ZERO = "0".repeat(40);

  function repo(): { dir: string; git: (...args: string[]) => string; commit: (path: string, msg: string) => void } {
    const dir = mkdtempSync(join(tmpdir(), "visual-gate-"));
    const git = (...args: string[]) => {
      const out = spawnSync("git", args, { cwd: dir, encoding: "utf8" });
      if (out.status !== 0) throw new Error(out.stderr);
      return out.stdout.trim();
    };
    git("init", "-q", "-b", "main");
    git("config", "user.email", "gate@test");
    git("config", "user.name", "gate");
    const commit = (path: string, msg: string) => {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), `${msg}\n`);
      git("add", path);
      git("commit", "-q", "-m", msg);
    };
    return { dir, git, commit };
  }

  function push(dir: string, sha: string, remote = ZERO) {
    return spawnSync("sh", [HOOK_PATH], {
      cwd: dir,
      input: `refs/heads/feature ${sha} refs/heads/feature ${remote}\n`,
      encoding: "utf8",
      env: { ...process.env, SKIP_VISUAL_GATE: "" },
    });
  }

  it("main 歷史裡的 baseline 變更不算數：只改 UI 的新分支會被擋", () => {
    const { dir, git, commit } = repo();
    try {
      commit("components/Old.tsx", "ui on main");
      commit("e2e/visual.spec.ts-snapshots/old.png", "baseline on main");
      git("update-ref", "refs/remotes/origin/main", "HEAD");
      git("switch", "-q", "-c", "feature");
      commit("components/New.tsx", "ui only");
      const result = push(dir, git("rev-parse", "HEAD"));
      expect(result.status).toBe(1);
      expect(result.stderr).toContain("components/New.tsx");
      expect(result.stderr).not.toContain("components/Old.tsx");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("新分支自己帶了 baseline 就放行；沒有 UI 變更也放行", () => {
    const { dir, git, commit } = repo();
    try {
      commit("README.md", "base");
      git("update-ref", "refs/remotes/origin/main", "HEAD");
      git("switch", "-q", "-c", "feature");
      commit("scripts/tool.ts", "not ui");
      expect(push(dir, git("rev-parse", "HEAD")).status).toBe(0);
      commit("components/New.tsx", "ui");
      commit("e2e/visual.spec.ts-snapshots/new.png", "baseline");
      expect(push(dir, git("rev-parse", "HEAD")).status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
