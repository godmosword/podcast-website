import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function readWorkflow(name: string): string {
  return readFileSync(join(ROOT, ".github/workflows", name), "utf8");
}

function readPackageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(
    readFileSync(join(ROOT, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
}

describe("P3 Playwright E2E CI 契約", () => {
  it("ci.yml 有獨立 e2e-child-path job，跑 test:e2e:ci", () => {
    const yaml = readWorkflow("ci.yml");
    expect(yaml).toContain("e2e-child-path:");
    expect(yaml).toContain("npm run test:e2e:ci");
    expect(yaml).toContain("npm run test:e2e:public");
    expect(yaml).not.toContain("test:visual");
    expect(yaml).not.toContain("visual.spec.ts");
  });

  it("test:e2e:ci 含兒童主路徑檔，不含視覺回歸", () => {
    const script = readPackageJson().scripts?.["test:e2e:ci"];
    expect(script, "package.json 缺少 test:e2e:ci").toBeTruthy();
    for (const file of [
      "e2e/smoke.spec.ts",
      "e2e/a11y.spec.ts",
      "e2e/universe-map.spec.ts",
      "e2e/games.spec.ts",
      "e2e/subscribe.spec.ts",
      "e2e/child-ux.spec.ts",
    ]) {
      expect(script, `test:e2e:ci 缺少 ${file}`).toContain(file);
    }
    expect(script).not.toContain("visual.spec.ts");
    expect(script).not.toContain("e2e/visual");
  });

  it("Playwright webServer 預設用正式 canonical，避免本機 bake localhost 讓 smoke 失敗", () => {
    const config = readFileSync(join(ROOT, "playwright.config.ts"), "utf8");
    expect(config).toContain("CANONICAL_SITE_URL");
    expect(config).toContain(
      "process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_SITE_URL",
    );
  });

  it("Apple sync／watchdog workflow 不得接入 Playwright（紅線）", () => {
    const sync = readWorkflow("sync-apple-podcast.yml");
    const watchdog = readWorkflow("sync-watchdog.yml");
    for (const [name, yaml] of [
      ["sync-apple-podcast.yml", sync],
      ["sync-watchdog.yml", watchdog],
    ] as const) {
      expect(yaml, name).not.toContain("playwright");
      expect(yaml, name).not.toContain("test:e2e");
      expect(yaml, name).not.toContain("e2e-child-path");
    }
  });
});
