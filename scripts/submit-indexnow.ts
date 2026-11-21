/**
 * IndexNow 提交（best-effort）：只通知官網網域。
 * Apple sync 不再呼叫這支，避免把實驗站網址送去收錄。
 *
 * 設計契約（勿破壞）：
 * - fail-soft **唯一**由本 script 保證：任何錯誤（無 key、API 失敗、逾時）
 *   一律 catch、寫 Job Summary 警示後 exit 0——workflow 端**不得**用
 *   continue-on-error 頂替（見 scripts/lib/sync-workflow-contract.test.ts）。
 * - live-domain workflow 等正式網域換上該次 build 才跑，所以不再為了等部署而 sleep。
 *   不保證索引（Google 不支援 IndexNow）；限制詳見 docs/GEO.md。
 * - URL 變更集來源：$SYNC_REPORT_PATH（sync-run-report.json），加上 push 範圍
 *   （INDEXNOW_BEFORE／INDEXNOW_AFTER／INDEXNOW_EDITION）。official 比對發行清單，
 *   其他比對 public/stories 的變更。都沒有時仍提交基本集（首頁、/stories、sitemap.xml）。
 *
 * 用法：
 *   npx tsx scripts/submit-indexnow.ts            實際提交（需 INDEXNOW_KEY）
 *   npx tsx scripts/submit-indexnow.ts --dry-run  只印 payload，不發送
 */
import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { getStories, isRetiredTopicTag } from "../data/content";
import { OFFICIAL_SITE_ORIGIN } from "../lib/site-edition";
import { getSiteUrl } from "../lib/site-url";
import { storySlugChanges, storySlugsFromChangedPaths } from "./lib/live-build";
import type { SyncRunReport } from "./lib/sync-report";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow 單次提交上限（本站遠低於此，chunk 防未來）。 */
const MAX_URLS_PER_BATCH = 10_000;
const FETCH_TIMEOUT_MS = 30_000;

type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

/** 同時寫 stdout 與 GitHub Job Summary（若在 Actions 環境）。 */
function report(line: string): void {
  console.log(line);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    try {
      appendFileSync(summaryPath, `${line}\n`, "utf8");
    } catch {
      // Job Summary 寫入失敗不影響流程
    }
  }
}

function readSyncReport(): SyncRunReport | null {
  const reportPath = process.env.SYNC_REPORT_PATH;
  if (!reportPath || !existsSync(reportPath)) return null;
  try {
    return JSON.parse(readFileSync(reportPath, "utf8")) as SyncRunReport;
  } catch {
    return null;
  }
}

/** 本輪 sync 變更的故事 slug（新集 + metadata／標籤／車種回填）。 */
function changedSlugs(syncReport: SyncRunReport | null): string[] {
  if (!syncReport) return [];
  return [
    ...new Set([
      ...syncReport.newEpisodes.map((episode) => episode.slug),
      ...syncReport.metadataUpdated,
      ...syncReport.tagBackfill,
      ...syncReport.vehicleBackfill,
    ]),
  ];
}

function git(args: string[]): string {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function releasedStoriesAt(ref: string): string[] {
  const body = JSON.parse(git(["show", `${ref}:data/official-release.json`])) as {
    stories?: unknown;
  };
  return Array.isArray(body.stories)
    ? body.stories.filter((slug): slug is string => typeof slug === "string")
    : [];
}

/**
 * push 範圍內有變的集數。讀不到（新分支、舊 commit 沒有發行清單、淺 clone）
 * 就只送基本集，不讓整次提交失敗。
 */
function pushRangeSlugs(): string[] {
  const before = process.env.INDEXNOW_BEFORE?.trim();
  const after = process.env.INDEXNOW_AFTER?.trim();
  if (!before || !after || /^0+$/.test(before)) return [];
  try {
    if (process.env.INDEXNOW_EDITION?.trim() === "official") {
      return storySlugChanges(releasedStoriesAt(before), releasedStoriesAt(after));
    }
    const paths = git(["diff", "--name-only", before, after, "--", "public/stories"]);
    return storySlugsFromChangedPaths(paths.split("\n"));
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    report(`IndexNow: 讀不到 push 範圍的集數變更，只送基本集（${message.split("\n")[0]}）`);
    return [];
  }
}

/**
 * 組提交 URL 清單：變更故事 canonical + 受影響聚合頁（topic／vehicles）
 * + /stories + 首頁 + sitemap.xml。
 */
function buildUrlList(slugs: string[], siteUrl: string): string[] {
  const urls = new Set<string>([
    siteUrl,
    `${siteUrl}/stories`,
    `${siteUrl}/sitemap.xml`,
  ]);
  const stories = getStories();
  for (const slug of slugs) {
    urls.add(`${siteUrl}/story/${slug}`);
    const story = stories.find((s) => s.slug === slug);
    if (!story) continue;
    if (story.vehicle) {
      urls.add(`${siteUrl}/vehicles/${encodeURIComponent(story.vehicle)}`);
    }
    for (const tag of story.tags ?? []) {
      if (isRetiredTopicTag(tag)) continue;
      urls.add(`${siteUrl}/topic/${encodeURIComponent(tag)}`);
    }
  }
  return [...urls];
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

async function submitBatch(payload: IndexNowPayload): Promise<void> {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (response.status === 200 || response.status === 202) {
    report(
      `IndexNow: 已提交 ${payload.urlList.length} 個 URL（HTTP ${response.status}）`,
    );
    return;
  }
  report(
    `⚠ IndexNow 提交失敗：HTTP ${response.status} ${response.statusText}（不擋 sync）`,
  );
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");

  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key && !dryRun) {
    report("IndexNow: skipped: no INDEXNOW_KEY");
    return;
  }

  const siteUrl = getSiteUrl();
  if (siteUrl.includes("localhost") && !dryRun) {
    report("IndexNow: skipped（site URL 為 localhost，非正式環境）");
    return;
  }
  if (!dryRun && new URL(siteUrl).origin !== OFFICIAL_SITE_ORIGIN) {
    report(`IndexNow: skipped（只提交 ${OFFICIAL_SITE_ORIGIN}，實際為 ${siteUrl}）`);
    return;
  }

  const effectiveKey = key ?? "dry-run-key";
  const slugs = [...new Set([...changedSlugs(readSyncReport()), ...pushRangeSlugs()])];
  const urlList = buildUrlList(slugs, siteUrl);
  const host = new URL(siteUrl).host;
  const keyLocation = `${siteUrl}/${effectiveKey}.txt`;

  for (const batch of chunk(urlList, MAX_URLS_PER_BATCH)) {
    const payload: IndexNowPayload = {
      host,
      key: effectiveKey,
      keyLocation,
      urlList: batch,
    };
    if (dryRun) {
      console.log("IndexNow dry-run payload:");
      console.log(JSON.stringify(payload, null, 2));
      continue;
    }
    await submitBatch(payload);
  }
}

// fail-soft 唯一出口：任何錯誤都不得讓 sync workflow 變紅。
main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    report(`⚠ IndexNow 提交失敗：${message}（不擋 sync）`);
  })
  .finally(() => {
    process.exitCode = 0;
  });
