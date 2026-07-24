import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CANONICAL_SITE_URL } from "../../lib/site-url";

const ROOT = process.cwd();

/** 完備測試（getStories 全集覆蓋）所需、sync 必須一起 commit 的 sidecar。
 * 教訓：#46／#60 — 新集寫入 apple-synced 後漏 sidecar 會讓 sync 卡死或假成功。 */
const CATALOG_SIDECAR_PATHS = [
  "data/story-zones.ts",
  "data/reflection-prompts.ts",
  "data/story-dates.ts",
  "data/episode-faqs.ts",
] as const;

function readWorkflow(name: string): string {
  return readFileSync(join(ROOT, ".github/workflows", name), "utf8");
}

function readSyncScript(): string {
  return readFileSync(join(ROOT, "scripts/sync-apple-podcast.ts"), "utf8");
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
      "data/story-zones.ts data/reflection-prompts.ts data/story-dates.ts data/episode-faqs.ts data/audio-lengths.json",
    );
    expect(yaml).toContain("git diff --name-only");
    expect(yaml).toContain("git ls-files --others --exclude-standard");
  });

  it("git add 必須含 catalog 完備測試所需的四 sidecar（防 #46／#60 回歸）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const addBlock = yaml.match(
      /git add[\s\S]*?(?=\n          if |\n          git )/,
    )?.[0];
    expect(addBlock, "找不到 Commit and push 的 git add").toBeDefined();
    for (const path of CATALOG_SIDECAR_PATHS) {
      expect(addBlock, `git add 缺少 ${path}`).toContain(path);
    }
  });

  // prebuild（generate:audio-lengths）產物，非 catalog sidecar；漏白名單會讓 #61 類 Commit and push 失敗。
  it("git add 必須含 data/audio-lengths.json（防 #61 回歸）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const addBlock = yaml.match(
      /git add[\s\S]*?(?=\n          if |\n          git )/,
    )?.[0];
    expect(addBlock, "找不到 Commit and push 的 git add").toBeDefined();
    expect(addBlock, "git add 缺少 data/audio-lengths.json").toContain(
      "data/audio-lengths.json",
    );
  });

  it("sync-apple-podcast.ts 必須呼叫 upsertCatalogSidecars（新集自動補 sidecar）", () => {
    const src = readSyncScript();
    expect(src).toContain(
      'import { upsertCatalogSidecars } from "./lib/sync-catalog-sidecars"',
    );
    expect(src).toMatch(/upsertCatalogSidecars\s*\(/);
    // 僅在有新集時寫入，避免無謂改動 sidecar
    expect(src).toMatch(
      /if\s*\(\s*hasNewEpisodes\s*\)\s*\{[\s\S]*?upsertCatalogSidecars\s*\(/,
    );
  });

  it("sync report 必須保留 FAQ MVP 待人工改寫清單", () => {
    const report = readFileSync(join(ROOT, "scripts/lib/sync-report.ts"), "utf8");
    const notify = readFileSync(join(ROOT, "scripts/post-sync-notify.ts"), "utf8");

    expect(report).toContain("episodeFaqStubs");
    expect(notify).toContain("FAQ MVP 待人工改寫");
    expect(notify).toContain("data/episode-faqs.ts");
  });

  it("完備測試仍以 getStories() 要求 catalog sidecar 全集覆蓋（契約對齊點）", () => {
    const zones = readFileSync(join(ROOT, "data/story-zones.test.ts"), "utf8");
    const prompts = readFileSync(
      join(ROOT, "data/reflection-prompts.test.ts"),
      "utf8",
    );
    const dates = readFileSync(join(ROOT, "data/story-dates.test.ts"), "utf8");

    expect(zones).toContain("getStories()");
    expect(zones).toContain("getStoryZoneId");
    expect(prompts).toContain("getStories()");
    expect(prompts).toContain("reflectionPrompt");
    expect(dates).toContain("getStories()");
    expect(dates).toContain("storyModifiedDates");
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

  it("sync workflow 失敗必須即時開去重告警，且告警步驟不得掩蓋原始失敗", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");

    expect(yaml).toContain("- name: Report sync failure");
    expect(yaml).toContain("if: failure()");
    expect(yaml).toContain("continue-on-error: true");
    expect(yaml).toContain("scripts/sync-alert.ts failure --kind=sync-job-failure");
    expect(yaml).not.toContain("actions/github-script");
    expect(yaml).not.toContain("github.rest.issues.create");
  });

  it("IndexNow 提交必須在 push 之後、main-only、注入 env，且 fail-soft 由 script 保證", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");

    const pushIndex = yaml.indexOf("- name: Commit and push");
    const indexNowIndex = yaml.indexOf("- name: Submit IndexNow");
    expect(pushIndex, "找不到 Commit and push 步驟").toBeGreaterThan(-1);
    expect(indexNowIndex, "找不到 Submit IndexNow 步驟").toBeGreaterThan(
      pushIndex,
    );

    const indexNowBlock = yaml.match(
      /- name: Submit IndexNow[\s\S]*?(?=\n      - name:)/,
    )?.[0];
    expect(indexNowBlock, "找不到 Submit IndexNow step").toBeDefined();
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
