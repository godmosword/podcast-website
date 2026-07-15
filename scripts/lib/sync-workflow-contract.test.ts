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
      "git add data/apple-synced.json data/apple-sync-state.json data/browse-index.json public/stories/ data/subtitles/ \\",
    );
    expect(yaml).toContain(
      "data/story-zones.ts data/reflection-prompts.ts data/story-dates.ts",
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

  it("IndexNow 提交必須在 push 之後、main-only、注入 env，且 fail-soft 由 script 保證", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");

    const pushIndex = yaml.indexOf("- name: Commit and push");
    const indexNowIndex = yaml.indexOf("- name: Submit IndexNow");
    expect(pushIndex, "找不到 Commit and push 步驟").toBeGreaterThan(-1);
    expect(indexNowIndex, "找不到 Submit IndexNow 步驟").toBeGreaterThan(
      pushIndex,
    );

    const indexNowBlock = yaml.slice(indexNowIndex);
    expect(indexNowBlock).toContain("scripts/submit-indexnow.ts");
    expect(indexNowBlock).toContain("github.ref == 'refs/heads/main'");
    expect(indexNowBlock).toContain("INDEXNOW_KEY:");
    expect(indexNowBlock).toContain("NEXT_PUBLIC_SITE_URL:");
    // fail-soft 唯一由 script 內部保證（exit 0 + Job Summary），
    // 步驟層不得用 continue-on-error 掩蓋其他錯誤。
    expect(indexNowBlock).not.toContain("continue-on-error");
  });

  it("sync-watchdog.yml 必須保留 RSS 新鮮度檢查", () => {
    const yaml = readWorkflow("sync-watchdog.yml");

    expect(yaml).toContain("group: sync-watchdog");
    expect(yaml).toContain("scripts/check-sync-fresh.ts");
  });
});
