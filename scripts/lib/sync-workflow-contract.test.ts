import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { load as parseYaml } from "js-yaml";
import { describe, expect, it } from "vitest";
import { CANONICAL_SITE_URL } from "../../lib/site-url";
import { isSyncOutputPath } from "./sync-outputs";

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

function workflowFilenames(): string[] {
  return readdirSync(join(ROOT, ".github/workflows")).filter((f) =>
    /\.ya?ml$/.test(f),
  );
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

function readCommitScript(): string {
  return readFileSync(join(ROOT, "scripts/ci/commit-and-push-sync.sh"), "utf8");
}

function gitAddBlock(script: string): string {
  const addBlock = script.match(/git add[\s\S]*?(?=\n\nif \[)/)?.[0];
  expect(addBlock, "找不到 commit 腳本的 git add").toBeDefined();
  return addBlock!;
}

/**
 * 每支 workflow 都必須是**可解析的 YAML**。
 *
 * 教訓（2026-08-27 `01a4047` → 2026-08-30 修復）：該 commit 在 `run: |` 的 block scalar
 * 裡讓 `gh pr create --body "…"` 的 shell 字串跨行，續行落在第 0 欄，提前終止了 block
 * scalar，整支 `sync-apple-podcast.yml` 變成無法解析。GitHub 只回
 * 「This run likely failed because of a workflow file issue」且**沒有 log**，
 * 三個觸發器（repository_dispatch／schedule／workflow_dispatch）全部失效，
 * Apple 新集自動同步停擺三天。
 *
 * 本檔其餘測試全是**正則字串比對**，語法壞掉照樣全綠——那三天 `npm test` 一直是綠的。
 * 這組測試就是補上這個洞：先確定檔案真的能 parse，再談內容契約。
 */
describe("workflow YAML 可解析性（語法閘門）", () => {
  const names = workflowFilenames();

  it("至少涵蓋四支現役 workflow", () => {
    expect(names).toEqual(
      expect.arrayContaining([
        "ci.yml",
        "sync-apple-podcast.yml",
        "sync-watchdog.yml",
        "verify-geo-live.yml",
      ]),
    );
  });

  for (const name of names) {
    it(`${name} 是合法 YAML，且有 on／jobs`, () => {
      let doc: unknown;
      expect(() => {
        doc = parseYaml(readWorkflow(name));
      }, `${name} YAML 解析失敗`).not.toThrow();

      // YAML 1.1 會把裸 `on:` 讀成布林 true，兩種 key 都接受
      const obj = doc as Record<string, unknown> & { true?: unknown };
      const triggers = obj.on ?? obj[true as unknown as keyof typeof obj];
      expect(triggers, `${name} 缺少 on:`).toBeDefined();
      expect(obj.jobs, `${name} 缺少 jobs:`).toBeDefined();
    });
  }

  it("sync-apple-podcast 的三個觸發器仍在（block scalar 壞掉時會整組消失）", () => {
    const doc = parseYaml(readWorkflow("sync-apple-podcast.yml")) as Record<
      string,
      unknown
    > & { true?: unknown };
    const triggers = (doc.on ?? doc[true as unknown as keyof typeof doc]) as
      | Record<string, unknown>
      | undefined;
    expect(Object.keys(triggers ?? {}).sort()).toEqual([
      "repository_dispatch",
      "schedule",
      "workflow_dispatch",
    ]);
  });
});

describe("sync workflow contract", () => {
  it("sync-apple-podcast.yml 只驗證同步產物，不跑全站測試或 build", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");

    expect(yaml).toContain("group: sync-apple-podcast");
    expect(yaml).toContain("npm run sync:apple");
    expect(yaml).toContain("npm run sync:validate");
    expect(yaml).toContain("bash scripts/ci/generate-derived-assets.sh");
    expect(yaml).toContain("bash scripts/ci/npm-install.sh");
    expect(yaml).toContain('HUSKY: "0"');
    expect(yaml).not.toMatch(/^ {6}run: npm test$/m);
    expect(yaml).not.toMatch(/^ {6}run: npm run build$/m);
    expect(yaml).not.toContain("npm run verify:episodes");
    expect(yaml).not.toContain("npm run verify:browse-index");
    expect(yaml).toContain("pull-requests: write");
    expect(yaml).toContain("actions: write");
    expect(yaml).toContain("fetch-and-generate:");
    expect(yaml).toContain("validate:");
    expect(yaml).toContain("commit:");
    expect(yaml).toContain('SKIP_TRANSCRIBE: "1"');
  });

  it("commit 推固定分支 sync/apple，開或沿用一張 auto-merge PR，不等 CI", () => {
    const script = readCommitScript();
    const yaml = readWorkflow("sync-apple-podcast.yml");
    expect(script).toContain('branch="${SYNC_BRANCH:-sync/apple}"');
    expect(script).toContain("--force-with-lease=");
    expect(script).toContain("gh pr create");
    expect(script).toContain("gh pr merge");
    expect(script).toContain("--squash --auto");
    expect(script).toContain(
      'gh workflow run ci.yml --ref "$branch" -f required_only=true',
    );
    expect(script).not.toContain("seq 1 80");
    expect(script).not.toContain("等待 sync PR merge 逾時");
    expect(script).not.toContain("quality_mirrored");
    expect(yaml).toContain("bash scripts/ci/reset-sync-branch.sh");
    expect(yaml).not.toContain("setup-whisper-ci.sh");
  });

  it("sync 的 shell 腳本可被 bash 解析，且 CI commit 不跑本機 hook", () => {
    const scriptDir = join(ROOT, "scripts/ci");
    const names = readdirSync(scriptDir).filter((name) => name.endsWith(".sh"));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(() => {
        execFileSync("bash", ["-n", join(scriptDir, name)], { stdio: "pipe" });
      }, `${name} bash -n 失敗`).not.toThrow();
    }
    const commit = readCommitScript();
    expect(commit).toContain("HUSKY=0");
    expect(commit).toContain("commit --no-verify");
    expect(commit).toContain("push --no-verify");
    expect(commit).not.toMatch(/^git add -A\b/m);
    expect(commit).toContain("git add -- data public/stories");
    // 已 stage 的列也會出現在 porcelain。不能把「有東西要 commit」當成殘檔。
    expect(commit).toContain('substr($0, 2, 1) != " "');
    expect(commit).not.toContain('if [ -n "$(git status --porcelain)" ]');
  });

  it("package.json 必須釘 overrides.browserslist 為 ^4.28.7（修補 GHSA-c83g-rgw3-j3cx）", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as { overrides?: Record<string, string> };

    expect(pkg.overrides?.browserslist).toBe("^4.28.7");
  });

  it("package.json 必須釘 overrides.source-map-js 為 1.2.2（修補 GHSA-68fv-2mgg-jv7q）", () => {
    const pkg = JSON.parse(
      readFileSync(join(ROOT, "package.json"), "utf8"),
    ) as { overrides?: Record<string, string> };
    const lock = readFileSync(join(ROOT, "package-lock.json"), "utf8");

    expect(pkg.overrides?.["source-map-js"]).toBe("1.2.2");
    expect(lock).toContain("source-map-js-1.2.2.tgz");
    expect(lock).not.toContain("source-map-js-1.2.1.tgz");
  });

  it("重跑時用 force-with-lease 蓋掉同一條 sync/apple，不另開分支", () => {
    const reset = readFileSync(join(ROOT, "scripts/ci/reset-sync-branch.sh"), "utf8");
    const commit = readCommitScript();
    expect(reset).toContain('git checkout -B "$branch" origin/main');
    expect(reset).toContain('git fetch origin "$branch"');
    expect(commit).toContain('--force-with-lease="refs/heads/$branch:$lease"');
    expect(commit).toContain(
      'gh pr list --base main --head "$branch" --state open --json url',
    );
  });

  it("git add 必須涵蓋 catalog sidecar（防 #46／#60 回歸）", () => {
    const addBlock = gitAddBlock(readCommitScript());
    expect(addBlock).toContain("git add -- data public/stories");
    for (const filePath of CATALOG_SIDECAR_PATHS) {
      expect(isSyncOutputPath(filePath), filePath).toBe(true);
    }
  });

  // prebuild（generate:audio-lengths）產物，非 catalog sidecar；漏白名單會讓 #61 類 Commit and push 失敗。
  it("git add 必須涵蓋 data/audio-lengths.json（防 #61 回歸）", () => {
    expect(gitAddBlock(readCommitScript())).toContain("data");
    expect(isSyncOutputPath("data/audio-lengths.json")).toBe(true);
    expect(isSyncOutputPath("data/story-image-blurs.json")).toBe(true);
  });

  it("prebuild 腳本必須全數登錄於 PREBUILD_OUTPUT_REGISTRY（防漏登再現 #61）", () => {
    const prebuild = readPackageJson().scripts?.prebuild;
    expect(prebuild, "package.json 缺少 scripts.prebuild").toBeTruthy();
    const scripts = parsePrebuildScripts(prebuild!);
    const registered = PREBUILD_OUTPUT_REGISTRY.map((entry) => entry.script);
    expect(scripts, "prebuild 腳本與 registry 不一致").toEqual(registered);
  });

  it("prebuild 產物必須落在同步路徑、gitignore，或 sync 不產生（sync-build-skip）", () => {
    const addBlock = gitAddBlock(readCommitScript());
    const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");

    for (const entry of PREBUILD_OUTPUT_REGISTRY) {
      if (entry.disposition === "git-add") {
        expect(
          isSyncOutputPath(entry.path) && addBlock.includes("data"),
          `prebuild ${entry.script} 產物 ${entry.path} 不在同步路徑`,
        ).toBe(true);
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

  it("封面 blur 等衍生資產必須在 sync-validate 之前產生（防 #251）", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const derived = readFileSync(
      join(ROOT, "scripts/ci/generate-derived-assets.sh"),
      "utf8",
    );
    const syncAt = yaml.indexOf("npm run sync:apple");
    const derivedAt = yaml.indexOf("name: Generate derived assets");
    const packAt = yaml.indexOf("name: Pack sync artifact");
    const validateAt = yaml.indexOf("npm run sync:validate");
    expect(syncAt).toBeGreaterThan(-1);
    expect(derivedAt).toBeGreaterThan(syncAt);
    expect(packAt).toBeGreaterThan(derivedAt);
    expect(validateAt).toBeGreaterThan(packAt);
    expect(yaml).toContain("needs: fetch-and-generate");
    expect(yaml).toMatch(/commit:[\s\S]*needs: \[fetch-and-generate, validate\]/);
    expect(derived).toContain("npm run generate:story-blurs");
    expect(derived).toContain("npm run generate:audio-lengths");
    expect(derived).toContain("scripts/ensure-sync-sidecars.ts");
    expect(isSyncOutputPath("data/story-image-blurs.json")).toBe(true);

    const src = readSyncScript();
    expect(src).toContain(
      'import { ensureStoryCoverBlurs } from "./lib/story-cover-blur"',
    );
    expect(src).toMatch(
      /await writeJson\(PATHS\.synced[\s\S]*?await syncStoryCoverBlurs\s*\(/,
    );
    expect(src).toMatch(/syncStoryCoverBlurs\(storyBlurTargets\)/);
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

  it("字幕再處理必須跳過已 --mark 的側車（防 OpenCC 覆寫校對）", () => {
    const src = readSyncScript();
    expect(src).toContain("isSubtitleProofreadMarked");
    expect(src).toMatch(/!isSubtitleProofreadMarked/);
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

  it("sync workflow 不跑 Production build，因此不會在驗證前寫出 IndexNow key file", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    expect(yaml).not.toContain("npm run build");
    expect(yaml).not.toMatch(/generate:indexnow-key/);
    const indexNowBlock = yaml.match(
      /- name: Submit IndexNow[\s\S]*?(?=\n      - name:)/,
    )?.[0];
    expect(indexNowBlock, "找不到 Submit IndexNow step").toBeDefined();
    expect(indexNowBlock).toContain("INDEXNOW_KEY:");
    expect(indexNowBlock).toContain(CANONICAL_SITE_URL);
  });

  it("sync workflow 失敗必須即時開去重告警，且告警步驟不得掩蓋原始失敗", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const report = readFileSync(join(ROOT, "scripts/ci/report-sync-failure.sh"), "utf8");
    const commit = readCommitScript();
    const alert = readFileSync(join(ROOT, "scripts/sync-alert.ts"), "utf8");

    expect(yaml).toContain("- name: Report sync failure");
    expect(yaml).toContain("needs.fetch-and-generate.result == 'failure'");
    expect(yaml).toContain("continue-on-error: true");
    expect(report).toContain("scripts/sync-alert.ts failure --kind=sync-job-failure");
    expect(commit).not.toContain("等待 sync PR merge 逾時");
    expect(yaml).not.toContain("actions/github-script");
    expect(yaml).not.toContain("github.rest.issues.create");
    expect(alert).toContain("alertAfterConsecutiveFailures");
    expect(alert).toContain("ALERT_AFTER_CONSECUTIVE");
  });

  it("IndexNow 提交必須在 push 之後、main-only、注入 env，且 fail-soft 由 script 保證", () => {
    const yaml = readWorkflow("sync-apple-podcast.yml");
    const script = readFileSync(join(ROOT, "scripts/ci/submit-indexnow.sh"), "utf8");

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
    expect(script).toContain("scripts/submit-indexnow.ts");
    expect(indexNowBlock).toContain("github.ref == 'refs/heads/main'");
    expect(indexNowBlock).toContain("INDEXNOW_KEY:");
    expect(indexNowBlock).toContain("NEXT_PUBLIC_SITE_URL:");
    expect(indexNowBlock).not.toContain("continue-on-error");
  });

  it("sync-watchdog.yml 必須保留 RSS 新鮮度檢查", () => {
    const yaml = readWorkflow("sync-watchdog.yml");

    expect(yaml).toContain("group: sync-watchdog");
    expect(yaml).toContain("scripts/check-sync-fresh.ts");
    expect(yaml).toContain("bash scripts/ci/npm-install.sh");
    expect(readWorkflow("ci.yml")).toContain("bash scripts/ci/run-actionlint.sh");
  });

  it("看門狗以政策決定 stale，不因 yaml STALE_HOURS=3 在第一次 sync 前開單", () => {
    const src = readFileSync(join(ROOT, "scripts/check-sync-fresh.ts"), "utf8");
    const yaml = readWorkflow("sync-watchdog.yml");

    expect(src).toContain("decideStaleRssAlert");
    expect(src).toContain("decideUnmergedSyncPr");
    expect(src).toContain("waitForFirstSyncHoursFromEnv");
    expect(src).toContain("hasOpenSyncLandingPr");
    expect(yaml).toContain('STALE_HOURS: "3"');
    expect(yaml).toContain("pull-requests: read");
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

  it("whisper 在獨立的 transcribe-backfill workflow，失敗滿 N 次才開 issue", () => {
    const yaml = readWorkflow("transcribe-backfill.yml");
    const src = readFileSync(join(ROOT, "scripts/transcribe-backfill.ts"), "utf8");
    expect(yaml).toContain("group: sync-apple-podcast");
    expect(yaml).toContain("npx tsx scripts/transcribe-backfill.ts");
    expect(yaml).toContain("bash scripts/setup-whisper-ci.sh");
    expect(yaml).toContain("bash scripts/ci/checkout-sync-base.sh");
    expect(src).toContain("SUBTITLE_ATTEMPT_LIMIT");
    expect(src).toContain('category: "whisper"');
    expect(readWorkflow("sync-apple-podcast.yml")).not.toContain("setup-whisper-ci.sh");
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
