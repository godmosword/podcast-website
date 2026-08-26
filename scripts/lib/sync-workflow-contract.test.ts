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

/**
 * package.json `prebuild` 腳本 → 產物處置（閉環，防 #61 類回歸）。
 * 新增／改掛 prebuild 腳本時必須先在此登錄，並依 disposition 補白名單或 gitignore。
 *
 * - `git-add`：tracked，sync Commit and push 白名單必含
 * - `gitignore`：不進版控，`.gitignore` 必含
 * - `sync-build-skip`：可能寫出未 ignore 的 tracked-looking 檔；sync Production build
 *   **不得**注入會觸發寫入的 env（目前：INDEXNOW_KEY）
 */
const PREBUILD_OUTPUT_REGISTRY = [
  {
    script: "generate:audio-lengths",
    path: "data/audio-lengths.json",
    disposition: "git-add",
  },
  {
    script: "generate:llms-full",
    path: "public/llms-full.txt",
    disposition: "gitignore",
  },
  {
    script: "generate:indexnow-key",
    path: "public/<INDEXNOW_KEY>.txt",
    disposition: "sync-build-skip",
  },
] as const;

function readWorkflow(name: string): string {
  return readFileSync(join(ROOT, ".github/workflows", name), "utf8");
}

function readSyncScript(): string {
  return readFileSync(join(ROOT, "scripts/sync-apple-podcast.ts"), "utf8");
}

function readPackageJson(): { scripts?: Record<string, string> } {
  return JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    scripts?: Record<string, string>;
  };
}

/** 從 `npm run generate:foo && …` 抽出腳本名（不含 npm run）。 */
function parsePrebuildScripts(prebuild: string): string[] {
  return prebuild
    .split("&&")
    .map((part) => part.trim())
    .map((part) => {
      const match = part.match(/^npm run (\S+)$/);
      expect(match, `prebuild 片段無法解析：${part}`).toBeTruthy();
      return match![1];
    });
}

function gitAddBlock(yaml: string): string {
  const addBlock = yaml.match(
    /git add[\s\S]*?(?=\n          if |\n          git )/,
  )?.[0];
  expect(addBlock, "找不到 Commit and push 的 git add").toBeDefined();
  return addBlock!;
}

function productionBuildBlock(yaml: string): string {
  const buildBlock = yaml.match(
    /- name: Production build[\s\S]*?(?=\n      - name:)/,
  )?.[0];
  expect(buildBlock, "找不到 Production build 步驟").toBeDefined();
  return buildBlock!;
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
    const addBlock = gitAddBlock(yaml);
    for (const path of CATALOG_SIDECAR_PATHS) {
      expect(addBlock, `git add 缺少 ${path}`).toContain(path);
    }
  });

  // prebuild（generate:audio-lengths）產物，非 catalog sidecar；漏白名單會讓 #61 類 Commit and push 失敗。
  it("git add 必須含 data/audio-lengths.json（防 #61 回歸）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    expect(gitAddBlock(yaml), "git add 缺少 data/audio-lengths.json").toContain(
      "data/audio-lengths.json",
    );
  });

  it("prebuild 腳本必須全數登錄於 PREBUILD_OUTPUT_REGISTRY（防漏登再現 #61）", () => {
    const prebuild = readPackageJson().scripts?.prebuild;
    expect(prebuild, "package.json 缺少 scripts.prebuild").toBeTruthy();
    const scripts = parsePrebuildScripts(prebuild!);
    const registered = PREBUILD_OUTPUT_REGISTRY.map((entry) => entry.script);
    expect(scripts, "prebuild 腳本與 registry 不一致").toEqual(registered);
  });

  it("prebuild 產物必須落在 git add 白名單或 gitignore（或 sync-build-skip）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const addBlock = gitAddBlock(yaml);
    const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");

    for (const entry of PREBUILD_OUTPUT_REGISTRY) {
      if (entry.disposition === "git-add") {
        expect(
          addBlock,
          `prebuild ${entry.script} 產物 ${entry.path} 未列入 git add`,
        ).toContain(entry.path);
        continue;
      }
      if (entry.disposition === "gitignore") {
        // .gitignore 可能寫 `/public/llms-full.txt` 或 `public/llms-full.txt`
        const bare = entry.path.replace(/^\//, "");
        expect(
          gitignore.includes(entry.path) ||
            gitignore.includes(`/${bare}`) ||
            gitignore.includes(bare),
          `prebuild ${entry.script} 產物 ${entry.path} 未列入 .gitignore`,
        ).toBe(true);
        continue;
      }
      // sync-build-skip：由「Production build 不得設 INDEXNOW_KEY」另測保證
      expect(entry.disposition).toBe("sync-build-skip");
    }
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
    const buildBlock = productionBuildBlock(yaml);

    expect(buildBlock).toContain("NEXT_PUBLIC_SITE_URL:");
    expect(buildBlock).toContain(CANONICAL_SITE_URL);
  });

  // IndexNow key file 檔名＝key、無法 glob ignore；若 Production build 注入 INDEXNOW_KEY，
  // prebuild 會寫出 public/<key>.txt → 未 stage 守衛失敗（#61 同類）。
  it("sync Production build 不得設 INDEXNOW_KEY（key file 僅部署產物，防白名單撞車）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const buildBlock = productionBuildBlock(yaml);

    expect(buildBlock).not.toMatch(/INDEXNOW_KEY\s*:/);
    // Submit IndexNow 步驟仍應注入（實送），與 build 分離
    const indexNowBlock = yaml.match(
      /- name: Submit IndexNow[\s\S]*?(?=\n      - name:)/,
    )?.[0];
    expect(indexNowBlock, "找不到 Submit IndexNow step").toBeDefined();
    expect(indexNowBlock).toContain("INDEXNOW_KEY:");
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

  it("notify-live 必須接受 report.gitHead 為 HEAD 祖先（GHA 先寫 report 再 commit）", () => {
    const alertSrc = readFileSync(join(ROOT, "scripts/sync-alert.ts"), "utf8");
    const reportSrc = readFileSync(join(ROOT, "scripts/lib/sync-report.ts"), "utf8");
    expect(reportSrc).toContain("isReportGitHeadAcceptable");
    expect(reportSrc).toContain("MAX_NOTIFY_GIT_HEAD_AHEAD");
    expect(alertSrc).toContain("isReportGitHeadAcceptable");
    expect(alertSrc).not.toMatch(
      /report\.gitHead\s*!==\s*current/,
    );
  });

  it("package.json 必須含本機 sync:notify 腳本", () => {
    const scripts = readPackageJson().scripts ?? {};
    expect(scripts["sync:notify"]).toBe("tsx scripts/sync-alert.ts notify-live");
    expect(scripts["sync:notify:reconcile"]).toBe(
      "tsx scripts/sync-alert.ts notify-live --reconcile",
    );
  });

  it("sync／watchdog 與 sync 腳本不得設 VISUAL_FIXTURE（禁止把凍結子集部署出去）", () => {
    expect(readWorkflow("sync-apple-podcast.yml")).not.toMatch(/VISUAL_FIXTURE/);
    expect(readWorkflow("sync-watchdog.yml")).not.toMatch(/VISUAL_FIXTURE/);
    expect(readSyncScript()).not.toMatch(/VISUAL_FIXTURE/);
  });

  it("預設 sync report 路徑必須落在 .cache 且被 gitignore", () => {
    const reportSrc = readFileSync(
      join(ROOT, "scripts/lib/sync-report.ts"),
      "utf8",
    );
    const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");

    expect(reportSrc).toContain("DEFAULT_SYNC_REPORT_RELATIVE");
    expect(reportSrc).toContain(".cache/sync-run-report.json");
    expect(gitignore).toMatch(/\/\.cache\//);
  });
});
