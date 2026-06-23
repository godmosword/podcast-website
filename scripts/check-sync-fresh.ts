#!/usr/bin/env npx tsx
/**
 * 同步看門狗：獨立驗證「RSS 最新一集是否已上站」，是 sync workflow 整個壞掉時的最後防線。
 * 不跑 whisper／build，秒級完成。
 *
 * 流程：
 *   1. 若 sync workflow 正在跑／排隊 → 靜默（避免長 job 期間誤報）。
 *   2. lookupFeedUrl → fetch → parseRssEpisodes（與 sync 同一 parser）。
 *   3. 以 sync 相同對照（isRssEpisodeOnSite）判斷最新集是否已上站。
 *   4. 未上站且 pubDate 有效且距今 > STALE_HOURS → 開/補 sync-stale-rss Issue；
 *      已上站 → 關閉該 Issue。pubDate 缺失／未來／invalid → 不告警。
 *
 * 環境變數：STALE_HOURS（預設 3）、SYNC_ALERT_DRY_RUN=1。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { lookupFeedUrl } from "../lib/podcast-apple";
import { parseRssEpisodes, type RssEpisode } from "./lib/apple-rss";
import {
  isRssEpisodeOnSite,
  type CatalogEntry,
} from "./lib/episode-match";
import { openOrCommentIssue, resolveIssue } from "./sync-alert";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SYNC_WORKFLOW = "sync-apple-podcast.yml";
const STALE_HOURS = Number(process.env.STALE_HOURS ?? "3");

type SyncState = { seenGuids?: string[] };

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path.join(ROOT, file), "utf8")) as T;
  } catch {
    return fallback;
  }
}

/** sync workflow 是否正在跑／排隊（避免長轉錄期間誤報 stale）。 */
function syncIsActive(): boolean {
  try {
    const out = execFileSync(
      "gh",
      [
        "run",
        "list",
        "--workflow",
        SYNC_WORKFLOW,
        "--json",
        "status",
        "--limit",
        "10",
      ],
      { encoding: "utf8" },
    );
    const runs = JSON.parse(out || "[]") as Array<{ status?: string }>;
    return runs.some(
      (r) => r.status === "in_progress" || r.status === "queued",
    );
  } catch {
    // 查不到狀態時，保守起見不抑制（寧可多查一次，也以 STALE_HOURS 緩衝避免誤報）
    return false;
  }
}

function ageHours(pubDate: string): number | null {
  const t = new Date(pubDate).getTime();
  if (Number.isNaN(t)) return null;
  const hours = (Date.now() - t) / 3_600_000;
  if (hours < 0) return null; // 未來時間：不告警
  return hours;
}

/** RSS 中尚未上站、且 pubDate 夠舊的最新一集（若有）。 */
function findStaleEpisode(
  rss: RssEpisode[],
  ctx: Parameters<typeof isRssEpisodeOnSite>[1],
): { item: RssEpisode; hours: number } | null {
  const missing = rss
    .filter((item) => !isRssEpisodeOnSite(item, ctx))
    .map((item) => ({ item, hours: ageHours(item.pubDate) }))
    .filter((x): x is { item: RssEpisode; hours: number } => x.hours != null)
    .filter((x) => x.hours > STALE_HOURS)
    .sort((a, b) => b.item.pubDate.localeCompare(a.item.pubDate));
  return missing[0] ?? null;
}

async function main(): Promise<void> {
  if (syncIsActive()) {
    console.log("sync workflow 正在跑／排隊，看門狗靜默。");
    return;
  }

  const feedUrl = await lookupFeedUrl();
  const res = await fetch(feedUrl, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const rss = parseRssEpisodes(await res.text());

  const catalog = readJson<CatalogEntry[]>("data/apple-synced.json", []);
  const state = readJson<SyncState>("data/apple-sync-state.json", {});
  const ctx = {
    seenGuids: new Set(state.seenGuids ?? []),
    catalog,
    eps: new Set(catalog.map((s) => s.ep)),
    slugs: new Set(catalog.map((s) => s.slug ?? "").filter(Boolean)),
  };

  const stale = findStaleEpisode(rss, ctx);
  if (!stale) {
    console.log("RSS 最新集皆已上站（或在緩衝期內）。");
    resolveIssue({
      kind: "sync-stale-rss",
      comment: "✅ RSS 最新一集已確認上站，看門狗解除告警。",
    });
    return;
  }

  const { item, hours } = stale;
  console.warn(`STALE：「${item.title}」距今 ${hours.toFixed(1)}h 仍未上站`);
  openOrCommentIssue({
    kind: "sync-stale-rss",
    title: "⚠️ RSS 有新集未上站",
    body: [
      `RSS 已有新集，但站上 \`data/apple-sync-state.json\` 尚未同步到。`,
      "",
      `- 集數：**${item.title}**`,
      `- guid：\`${item.guid}\``,
      `- 發佈：${item.pubDate}（距今 ${hours.toFixed(1)} 小時）`,
      `- feed：${feedUrl}`,
      "",
      `請檢查 sync-apple-podcast workflow 最近的 run 是否失敗。`,
    ].join("\n"),
  });
}

const entry = process.argv[1]?.replace(/\\/g, "/") ?? "";
if (entry.endsWith("check-sync-fresh.ts")) {
  main().catch((err) => {
    // 看門狗本身故障不應淹沒：印出但 exit 0，避免 workflow 紅成噪音
    console.error(`watchdog 失敗（忽略）：${(err as Error).message}`);
  });
}
