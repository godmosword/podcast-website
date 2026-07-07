import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_SITE_URL } from "../../lib/site-url";

const ROOT = process.cwd();

function readWorkflow(name: string): string {
  return readFileSync(join(ROOT, ".github/workflows", name), "utf8");
}

describe("sync workflow contract", () => {
  it("sync-apple-podcast.yml 必須保留同步管線關鍵步驟（禁止無意刪改）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");

    expect(yaml).toContain("group: sync-apple-podcast");
    expect(yaml).toContain("npm run sync:apple");
    expect(yaml).toContain("npm run verify:episodes");
    expect(yaml).toContain("npm run verify:browse-index");
    expect(yaml).toContain("npm test");
    expect(yaml).toContain("npm run build");
    expect(yaml).toContain(
      "git add data/apple-synced.json data/apple-sync-state.json data/browse-index.json public/stories/ data/subtitles/",
    );
  });

  it("sync workflow 的 Production build 必須設 NEXT_PUBLIC_SITE_URL（避免 CI fallback localhost 使 build 失敗）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const buildBlock = yaml.match(
      /- name: Production build[\s\S]*?(?=\n      - name:)/,
    )?.[0];

    expect(buildBlock, "找不到 Production build 步驟").toBeDefined();
    expect(buildBlock).toContain("NEXT_PUBLIC_SITE_URL:");
    expect(buildBlock).toContain(CANONICAL_SITE_URL);
  });

  it("sync workflow 不得把單次 workflow 失敗升級成 GitHub Issue", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");

    expect(yaml).not.toContain("if: failure()");
    expect(yaml).not.toContain("actions/github-script");
    expect(yaml).not.toContain("github.rest.issues.create");
    expect(yaml).not.toContain("sync-alert.ts failure");
    expect(yaml).not.toContain("Apple 同步失敗");
  });

  it("sync-watchdog.yml 必須保留 RSS 新鮮度檢查", () => {
    const yaml = readWorkflow("sync-watchdog.yml");

    expect(yaml).toContain("group: sync-watchdog");
    expect(yaml).toContain("scripts/check-sync-fresh.ts");
  });
});
