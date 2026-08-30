import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
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
