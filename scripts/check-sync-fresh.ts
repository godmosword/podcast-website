#!/usr/bin/env npx tsx
/**
 * 同步看門狗：獨立驗證「RSS 最新一集是否已上站」，是 sync workflow 整個壞掉時的最後防線。
 * 不跑 whisper／build，秒級完成。
 *
 * 流程：
 *   1. lookupFeedUrl → fetch → parseRssEpisodes（與 sync 同一 parser）。
 *   2. 以 sync 相同對照（isRssEpisodeOnSite）判斷最新集是否已上站。
 *   3. 已上站 → 關閉 sync-stale-rss Issue。
 *   4. 未上站：sync 正在跑、已有 sync/apple PR 尚未合入，或仍在等待第一次 sync
 *      （WAIT_FOR_SYNC_HOURS，預設至少 8h）→ 靜默，避免與之後的「待生圖」Issue 連開兩張。
 *      超過等待窗且沒有在等合入的 sync PR，才開／補 sync-stale-rss。
 *   5. sync/apple PR 開超過 2 小時還沒合入 → 另記 sync-unmerged-pr，不跟 stale 混單。
 *
 * 環境變數：STALE_HOURS（yaml 仍可設 3，僅作下限）、WAIT_FOR_SYNC_HOURS、SYNC_ALERT_DRY_RUN=1。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchRssXml, lookupFeedUrlWithRetry } from "./lib/apple-feed";
import { parseRssEpisodes, type RssEpisode } from "./lib/apple-rss";
import {
  isRssEpisodeOnSite,
  type CatalogEntry,
} from "./lib/episode-match";
import {
  alertAfterConsecutiveFailures,
  clearAlertStreak,
  resolveIssue,
} from "./sync-alert";
import {
  decideStaleRssAlert,
  decideUnmergedSyncPr,
  hasOpenSyncLandingPr,
  isSyncRunActive,
  runsAfterPubDate,
  waitForFirstSyncHoursFromEnv,
  type SyncLandingPr,
  type SyncWorkflowRun,
} from "./lib/sync-stale-policy";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SYNC_WORKFLOW = "sync-apple-podcast.yml";
const WAIT_FOR_SYNC_HOURS = waitForFirstSyncHoursFromEnv();

type SyncState = { seenGuids?: string[] };

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path.join(ROOT, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** gh 失敗時回空陣列，避免清單失敗把真的卡住靜默掉。 */
function listOpenPullRequests(): SyncLandingPr[] {
  try {
    const out = execFileSync(
      "gh",
      [
        "pr",
        "list",
        "--state",
        "open",
        "--limit",
        "20",
        "--json",
        "headRefName,createdAt,url,number,title",
      ],
      { encoding: "utf8" },
    );
    return JSON.parse(out || "[]") as SyncLandingPr[];
  } catch {
    return [];
  }
}

function listSyncRuns(): SyncWorkflowRun[] {
  try {
    const out = execFileSync(
      "gh",
      [
        "run",
        "list",
        "--workflow",
        SYNC_WORKFLOW,
        "--json",
        "status,conclusion,createdAt,startedAt",
        "--limit",
        "10",
      ],
      { encoding: "utf8" },
    );
    return JSON.parse(out || "[]") as SyncWorkflowRun[];
  } catch {
    return [];
  }
}

function ageHours(pubDate: string): number | null {
  const t = new Date(pubDate).getTime();
  if (Number.isNaN(t)) return null;
  const hours = (Date.now() - t) / 3_600_000;
  if (hours < 0) return null; // 未來時間：不告警
  return hours;
}

/** RSS 中尚未上站、且有有效 pubDate 的最新一集（若有）。 */
function findMissingEpisode(
  rss: RssEpisode[],
  ctx: Parameters<typeof isRssEpisodeOnSite>[1],
): { item: RssEpisode; hours: number } | null {
  const missing = rss
    .filter((item) => !isRssEpisodeOnSite(item, ctx))
    .map((item) => ({ item, hours: ageHours(item.pubDate) }))
    .filter((x): x is { item: RssEpisode; hours: number } => x.hours != null)
    .sort((a, b) => b.item.pubDate.localeCompare(a.item.pubDate));
  return missing[0] ?? null;
}

async function main(): Promise<void> {
  const feedUrl = await lookupFeedUrlWithRetry();
  const rss = parseRssEpisodes(await fetchRssXml(feedUrl));

  const catalog = readJson<CatalogEntry[]>("data/apple-synced.json", []);
  const state = readJson<SyncState>("data/apple-sync-state.json", {});
  const ctx = {
    seenGuids: new Set(state.seenGuids ?? []),
    catalog,
    eps: new Set(catalog.map((s) => s.ep)),
    slugs: new Set(catalog.map((s) => s.slug ?? "").filter(Boolean)),
  };

  const openPrs = listOpenPullRequests();
  const unmerged = decideUnmergedSyncPr({ prs: openPrs });
  const missing = findMissingEpisode(rss, ctx);
  if (!missing && unmerged.action !== "open") {
    console.log("RSS 最新集皆已上站。");
    clearAlertStreak();
    resolveIssue({
      kind: "sync-stale-rss",
      comment: "✅ RSS 最新一集已確認上站，看門狗解除告警。",
    });
    resolveIssue({
      kind: "sync-unmerged-pr",
      comment: "✅ 沒有卡住的 sync PR，看門狗解除告警。",
    });
    return;
  }

  if (unmerged.action === "open" && unmerged.pr) {
    const prUrl = unmerged.pr.url ?? "(unknown)";
    console.warn(`UNMERGED：${prUrl} ${unmerged.reason}`);
    alertAfterConsecutiveFailures({
      category: "commit",
      step: "Unmerged sync PR",
      kind: "sync-unmerged-pr",
      title: "[sync][commit] sync PR 尚未合入",
      body: [
        "固定分支 `sync/apple` 的 PR 開著，內容還沒進 main。",
        "",
        `- PR：${prUrl}`,
        `- 原因：${unmerged.reason}`,
        "",
        "看門狗不等 CI。這張單是在 auto-merge 太久沒完成時才開。",
      ].join("\n"),
      excerpt: `##[error]${unmerged.reason} ${prUrl}`,
    });
    return;
  }

  if (!missing) return;

  const runs = listSyncRuns();
  const syncActive = runs.some(isSyncRunActive);
  const decision = decideStaleRssAlert({
    onSite: false,
    hours: missing.hours,
    syncActive,
    postPublishRuns: runsAfterPubDate(runs, missing.item.pubDate),
    waitForFirstSyncHours: WAIT_FOR_SYNC_HOURS,
    syncLandingPending: hasOpenSyncLandingPr(openPrs),
  });

  if (decision.action === "silent") {
    console.log(decision.reason);
    return;
  }

  const { item, hours } = missing;
  console.warn(`STALE：「${item.title}」距今 ${hours.toFixed(1)}h 仍未上站`);
  const body = [
    `RSS 已有新集，但站上 \`data/apple-sync-state.json\` 尚未同步到。`,
    "",
    `- 集數：**${item.title}**`,
    `- guid：\`${item.guid}\``,
    `- 發佈：${item.pubDate}（距今 ${hours.toFixed(1)} 小時）`,
    `- feed：${feedUrl}`,
    "",
    `請檢查 sync-apple-podcast workflow 最近的 run 是否失敗。`,
    "",
    `> 若稍後同步成功，\`notify-live\` 會把**本單**改成待生圖 checklist，不會另開第二張 Issue。`,
  ].join("\n");
  alertAfterConsecutiveFailures({
    category: "stale-rss",
    step: "Check RSS freshness vs site",
    kind: "sync-stale-rss",
    title: "⚠️ RSS 有新集未上站",
    body,
    excerpt: `##[error]STALE：「${item.title}」距今 ${hours.toFixed(1)}h 仍未上站`,
  });
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("check-sync-fresh.ts")) {
  main().catch((err) => {
    // 看門狗本身故障不應淹沒：印出但 exit 0，避免 workflow 紅成噪音
    console.error(`watchdog 失敗（忽略）：${(err as Error).message}`);
  });
}
