#!/usr/bin/env npx tsx
/**
 * 從 Apple Podcast RSS 同步到 data/apple-synced.json 與 public/stories/<slug>/。
 * - 新集：下載音檔／封面並追加至 apple-synced.json
 * - 既有集：比對 RSS 更新 title / date / duration / summary 等 metadata
 * 用法：npm run sync:apple [-- --dry-run] [-- --force]
 *       npm run sync:apple -- --refresh-cover[=ep-11[,ep-12]]
 *         （重抓既有集數封面：Apple 端事後換圖時用）
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { episodeColorForSlug } from "../data/episode-colors";
import type { Story } from "../data/stories";
import { manualStories } from "../data/stories";
import { lookupFeedUrl } from "../lib/podcast-apple";
import {
  APPLE_SYNC_PAGE_COUNT,
  applyTagInference,
  applyVehicleInference,
} from "./lib/apple-sync-profile";
import {
  cleanEpisodeSummary,
  parseRssEpisodes,
  pubDateToIsoDate,
  slugForEpisode,
  type RssEpisode,
} from "./lib/apple-rss";
import {
  createEmptyReport,
  isIllustrateSlug,
  writeSyncReport,
  type SyncRunReport,
} from "./lib/sync-report";
import {
  findCatalogEpByTitle,
  normalizeTitle,
  titleStem,
} from "./lib/episode-match";
import { downloadAndSaveCover } from "./lib/cover-image";
import {
  hasSubtitleSidecar,
  listSidecarSlugs,
  listSlugsMissingSubtitles,
  relocalizeSidecars,
  transcribeToSidecar,
  whisperAvailable,
} from "./lib/transcribe-core";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MAX_NEW_PER_RUN = 3;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 120_000;

const PATHS = {
  synced: path.join(ROOT, "data/apple-synced.json"),
  state: path.join(ROOT, "data/apple-sync-state.json"),
  defaults: path.join(ROOT, "data/apple-sync.defaults.json"),
  storiesPublic: path.join(ROOT, "public/stories"),
};

type SyncState = {
  seenGuids: string[];
  lastRun: string | null;
  /** slug → RSS guid，標題變更時仍能對到正確集數 */
  guidBySlug?: Record<string, string>;
};

type SyncDefaults = {
  vehicle: string;
  emoji: string;
  color: string;
  tags: string[];
  /** 新集預設插圖張數；與官網 MVP 單圖播放器一致 */
  pageCount: number;
  overrides: Record<string, Partial<Story>>;
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

/**
 * 重抓既有集數封面：Apple 端事後換圖時用。一般同步只在「新集數」下載封面，
 * 既有集數即使 Apple 換了首圖也不會更新——此模式從 RSS imageUrl 重新下載覆蓋。
 * 封面會以 fit:contain 縮放至 1400²，完整保留不被裁切。
 *   --refresh-cover              重抓所有 RSS 有提供封面的集數
 *   --refresh-cover=ep-11        只重抓指定集數（可逗號分隔多個）
 *   --refresh-cover ep-11,ep-12  同上（值放後一個參數）
 */
function parseRefreshCover(): { enabled: boolean; slugs: string[] } {
  const flagIdx = args.findIndex(
    (a) => a === "--refresh-cover" || a.startsWith("--refresh-cover="),
  );
  if (flagIdx === -1) return { enabled: false, slugs: [] };
  const inline = args[flagIdx].includes("=")
    ? args[flagIdx].slice(args[flagIdx].indexOf("=") + 1)
    : "";
  const next =
    !inline && args[flagIdx + 1] && !args[flagIdx + 1].startsWith("--")
      ? args[flagIdx + 1]
      : "";
  const slugs = (inline || next)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return { enabled: true, slugs };
}

const refreshCover = parseRefreshCover();
const SYNC_REPORT_PATH = process.env.SYNC_REPORT_PATH;
const report: SyncRunReport = createEmptyReport(dryRun);

async function finishSync(): Promise<void> {
  report.illustratePending = report.newEpisodes
    .map((e) => e.slug)
    .filter(isIllustrateSlug);
  await writeSyncReport(report, SYNC_REPORT_PATH);
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function existingEps(synced: Story[]): Set<number> {
  const eps = new Set<number>();
  for (const s of [...manualStories, ...synced]) eps.add(s.ep);
  return eps;
}

function existingSlugs(synced: Story[]): Set<string> {
  const slugs = new Set<string>();
  for (const s of [...manualStories, ...synced]) slugs.add(s.slug);
  return slugs;
}

function applyDefaults(
  base: Story,
  defaults: SyncDefaults,
): Story {
  const override = defaults.overrides[base.slug] ?? {};
  return {
    ...base,
    vehicle: override.vehicle ?? defaults.vehicle,
    emoji: override.emoji ?? defaults.emoji,
    color: override.color ?? episodeColorForSlug(base.slug),
    tags: override.tags ?? defaults.tags,
    ...(override.summary !== undefined ? { summary: override.summary } : {}),
    ...(override.captions !== undefined ? { captions: override.captions } : {}),
    ...(override.captionTimes !== undefined
      ? { captionTimes: override.captionTimes }
      : {}),
    ...(override.duration !== undefined ? { duration: override.duration } : {}),
    pageCount: override.pageCount ?? defaults.pageCount ?? APPLE_SYNC_PAGE_COUNT,
  };
}

function hasTagsOverride(defaults: SyncDefaults, slug: string): boolean {
  return defaults.overrides[slug]?.tags != null;
}

function hasVehicleOverride(defaults: SyncDefaults, slug: string): boolean {
  return defaults.overrides[slug]?.vehicle != null;
}

function applySyncProfile(
  story: Story,
  title: string,
  summary: string | undefined,
  keywords: string[] | undefined,
  defaults: SyncDefaults,
  slug: string,
): Story {
  const withVehicle = applyVehicleInference(
    story,
    title,
    summary,
    keywords,
    defaults.vehicle,
    hasVehicleOverride(defaults, slug),
  );
  return applyTagInference(
    withVehicle,
    title,
    summary,
    keywords,
    hasTagsOverride(defaults, slug),
  );
}

function tagsEqual(a?: string[], b?: string[]): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

function rssToStory(
  item: RssEpisode,
  ep: number,
  defaults: SyncDefaults,
): Story {
  const slug = slugForEpisode(ep);
  const summary = cleanEpisodeSummary(item.description);
  const base: Story = {
    slug,
    ep,
    title: item.title,
    date: pubDateToIsoDate(item.pubDate),
    duration: item.duration ?? undefined,
    vehicle: defaults.vehicle,
    emoji: defaults.emoji,
    color: episodeColorForSlug(slug),
    audio: "audio.mp3",
    pageCount: defaults.pageCount ?? APPLE_SYNC_PAGE_COUNT,
    summary,
    tags: [...defaults.tags],
  };
  const withDefaults = applyDefaults(base, defaults);
  return applySyncProfile(
    withDefaults,
    item.title,
    summary,
    item.keywords,
    defaults,
    slug,
  );
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  const len = res.headers.get("content-length");
  if (len && parseInt(len, 10) > MAX_AUDIO_BYTES) {
    throw new Error(`File too large (${len} bytes): ${url}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_AUDIO_BYTES) {
    throw new Error(`File too large (${buf.length} bytes): ${url}`);
  }
  await fs.writeFile(dest, buf);
}

/**
 * 新集自動上字幕：本機有 whisper-cli + 模型時，轉錄音檔產生即時字幕側車檔。
 * 缺工具/模型（如一般 CI）或設 SKIP_TRANSCRIBE=1 時自動跳過，絕不中斷同步。
 * 轉錄為草稿，仍建議人工校對。
 */
function maybeTranscribe(slug: string, audioPath: string): void {
  if (process.env.SKIP_TRANSCRIBE === "1") return;
  if (hasSubtitleSidecar(slug)) return;
  if (!whisperAvailable()) {
    console.log(`  字幕：跳過（本機無 whisper-cli/模型；可後續 npm run transcribe -- ${slug}）`);
    return;
  }
  try {
    console.log("  字幕：轉錄中（本機 whisper）…");
    const { count, file } = transcribeToSidecar(slug, audioPath);
    console.log(`  字幕：${count} 句 → ${path.relative(ROOT, file)}（草稿，請校對）`);
    if (!report.subtitlesCreated.includes(slug)) {
      report.subtitlesCreated.push(slug);
    }
  } catch (err) {
    console.warn(`  字幕：轉錄失敗，略過（${(err as Error).message}）`);
  }
}

/** 同步後補齊缺字幕的集數（含先前 CI 只下載音檔、未轉錄者）。 */
function backfillMissingSubtitles(catalog: Story[]): void {
  if (dryRun || process.env.SKIP_TRANSCRIBE === "1") return;

  const missing = listSlugsMissingSubtitles(catalog.map((s) => s.slug));
  if (missing.length === 0) return;

  if (!whisperAvailable()) {
    console.log(
      `字幕補齊：${missing.length} 集缺側車檔（${missing.join(", ")}），跳過（無 whisper-cli/模型）`,
    );
    return;
  }

  console.log(`字幕補齊：${missing.length} 集（${missing.join(", ")}）`);
  for (const slug of missing) {
    const audioPath = path.join(PATHS.storiesPublic, slug, "audio.mp3");
    maybeTranscribe(slug, audioPath);
  }
}

/**
 * 轉錄後再跑一次字幕清理（簡轉繁 + 幻覺過濾 + 人名修正），
 * 確保 deploy 前側車檔與最新邏輯一致；不重跑 Whisper。
 */
function relocalizeCatalogSubtitles(catalog: Story[]): void {
  if (dryRun) return;

  const slugs = listSidecarSlugs(catalog.map((s) => s.slug));
  if (slugs.length === 0) return;

  console.log(`字幕再處理：簡轉繁 + 過濾（${slugs.length} 集）…`);
  const { ok, failed } = relocalizeSidecars(slugs);
  console.log(`字幕再處理：完成 ${ok}/${slugs.length} 集`);
  if (failed.length > 0) {
    console.warn(`字幕再處理：略過 ${failed.join(", ")}`);
  }
}

type NewEpisodeCandidate = { item: RssEpisode; ep: number };

function findRssItemForStory(
  story: Story,
  rssItems: RssEpisode[],
  guidBySlug: Record<string, string>,
): RssEpisode | null {
  const mappedGuid = guidBySlug[story.slug];
  if (mappedGuid) {
    const byGuid = rssItems.find((i) => i.guid === mappedGuid);
    if (byGuid) return byGuid;
  }
  if (story.ep != null) {
    const byEp = rssItems.find((i) => i.episode === story.ep);
    if (byEp) return byEp;
  }
  const key = normalizeTitle(story.title);
  const byTitle = rssItems.find((i) => normalizeTitle(i.title) === key);
  if (byTitle) return byTitle;

  const stem = titleStem(story.title);
  if (stem.length >= 4) {
    const byStem = rssItems.find((i) => titleStem(i.title) === stem);
    if (byStem) return byStem;
  }

  return null;
}

function storyFromRssMetadata(
  existing: Story,
  item: RssEpisode,
  defaults: SyncDefaults,
): Story {
  const summary = cleanEpisodeSummary(item.description);
  const base: Story = {
    ...existing,
    title: item.title,
    date: pubDateToIsoDate(item.pubDate),
    duration: item.duration ?? existing.duration,
    ...(summary !== undefined ? { summary } : {}),
  };
  const withDefaults = applyDefaults(base, defaults);
  return applySyncProfile(
    withDefaults,
    item.title,
    summary,
    item.keywords,
    defaults,
    existing.slug,
  );
}

function metadataFieldsChanged(before: Story, after: Story): boolean {
  return (
    before.title !== after.title ||
    before.date !== after.date ||
    before.duration !== after.duration ||
    before.summary !== after.summary ||
    before.vehicle !== after.vehicle ||
    !tagsEqual(before.tags, after.tags)
  );
}

/** 補齊 apple-synced 中仍缺 tags 的集數（用本地 title/summary，無 RSS 關鍵字時）。 */
function backfillMissingTags(
  synced: Story[],
  defaults: SyncDefaults,
): { stories: Story[]; updatedSlugs: string[] } {
  const updatedSlugs: string[] = [];
  const stories = synced.map((story) => {
    if (hasTagsOverride(defaults, story.slug) || (story.tags?.length ?? 0) > 0) {
      return story;
    }
    const next = applyTagInference(
      story,
      story.title,
      story.summary,
      undefined,
      false,
    );
    if (!tagsEqual(story.tags, next.tags)) {
      updatedSlugs.push(story.slug);
      return next;
    }
    return story;
  });
  return { stories, updatedSlugs };
}

/** 補齊 apple-synced 中仍為預設車種「其他」的集數（用 title/summary 推斷）。 */
function backfillMissingVehicles(
  synced: Story[],
  defaults: SyncDefaults,
): { stories: Story[]; updatedSlugs: string[] } {
  const updatedSlugs: string[] = [];
  const stories = synced.map((story) => {
    if (
      hasVehicleOverride(defaults, story.slug) ||
      story.vehicle !== defaults.vehicle
    ) {
      return story;
    }
    const next = applyVehicleInference(
      story,
      story.title,
      story.summary,
      undefined,
      defaults.vehicle,
      false,
    );
    if (story.vehicle !== next.vehicle || story.emoji !== next.emoji) {
      updatedSlugs.push(story.slug);
      return next;
    }
    return story;
  });
  return { stories, updatedSlugs };
}

type MetadataUpdateResult = {
  stories: Story[];
  updatedSlugs: string[];
  guidBySlug: Record<string, string>;
};

/** 將 RSS 最新 metadata 套回已同步集數（不重新下載音檔）。 */
function updateSyncedMetadata(
  synced: Story[],
  rssItems: RssEpisode[],
  defaults: SyncDefaults,
  guidBySlug: Record<string, string>,
): MetadataUpdateResult {
  const updatedSlugs: string[] = [];
  const nextGuidBySlug = { ...guidBySlug };

  const stories = synced.map((story) => {
    const item = findRssItemForStory(story, rssItems, nextGuidBySlug);
    if (!item) return story;

    nextGuidBySlug[story.slug] = item.guid;
    const next = storyFromRssMetadata(story, item, defaults);
    if (metadataFieldsChanged(story, next)) {
      updatedSlugs.push(story.slug);
      return next;
    }
    return story;
  });

  return { stories, updatedSlugs, guidBySlug: nextGuidBySlug };
}

function pickNewEpisodes(
  rssItems: RssEpisode[],
  state: SyncState,
  catalog: Story[],
  eps: Set<number>,
  slugs: Set<string>,
): NewEpisodeCandidate[] {
  const seen = new Set(state.seenGuids);
  const candidates: NewEpisodeCandidate[] = [];
  let runningMax = eps.size > 0 ? Math.max(...eps) : 0;

  for (const item of rssItems) {
    if (seen.has(item.guid)) continue;

    const matchedEp = findCatalogEpByTitle(item.title, catalog);
    if (matchedEp != null) continue;

    const ep = item.episode ?? ++runningMax;
    if (eps.has(ep)) {
      console.warn(`Skip ep ${ep} (already in catalog): ${item.title}`);
      continue;
    }
    const slug = slugForEpisode(ep);
    if (slugs.has(slug)) {
      console.warn(`Skip slug ${slug} (already exists): ${item.title}`);
      continue;
    }

    candidates.push({ item, ep });
    runningMax = Math.max(runningMax, ep);
  }

  candidates.sort((a, b) => b.ep - a.ep);
  return candidates.slice(0, MAX_NEW_PER_RUN);
}

/** 已存在於目錄的集數或標題，將 RSS guid 記入 state 避免重複處理。 */
function reconcileSeenGuids(
  rssItems: RssEpisode[],
  state: SyncState,
  catalog: Story[],
  eps: Set<number>,
): string[] {
  const seen = new Set(state.seenGuids);
  for (const item of rssItems) {
    if (item.episode != null && eps.has(item.episode)) {
      seen.add(item.guid);
    }
    if (findCatalogEpByTitle(item.title, catalog) != null) {
      seen.add(item.guid);
    }
  }
  return [...seen];
}

/**
 * 重抓既有集數封面：對每個目標集數從 RSS imageUrl 重新下載覆蓋 01.jpg。
 * 不動 metadata、不挑新集，是專注的單一操作。
 */
async function refreshCovers(
  catalog: Story[],
  rssItems: RssEpisode[],
  guidBySlug: Record<string, string>,
  filterSlugs: string[],
): Promise<void> {
  const filter = new Set(filterSlugs);
  const targets = catalog.filter((s) => filter.size === 0 || filter.has(s.slug));

  if (filter.size > 0) {
    const known = new Set(catalog.map((s) => s.slug));
    for (const slug of filterSlugs) {
      if (!known.has(slug)) console.warn(`Skip ${slug}: 不在 catalog 中`);
    }
  }
  if (targets.length === 0) {
    console.warn("沒有符合的集數可重抓封面。");
    return;
  }

  let updated = 0;
  for (const story of targets) {
    const item = findRssItemForStory(story, rssItems, guidBySlug);
    if (!item) {
      console.warn(`Skip ${story.slug}: RSS 找不到對應集數`);
      continue;
    }
    if (!item.imageUrl) {
      console.warn(`Skip ${story.slug}: RSS 無封面 imageUrl`);
      continue;
    }
    const imagePath = path.join(PATHS.storiesPublic, story.slug, "01.jpg");
    if (dryRun) {
      console.log(`[dry-run] ${story.slug} ← ${item.imageUrl}`);
      updated += 1;
      continue;
    }
    await fs.mkdir(path.dirname(imagePath), { recursive: true });
    console.log(`Refresh cover ${story.slug} ← ${item.imageUrl}`);
    await downloadAndSaveCover(item.imageUrl, imagePath);
    updated += 1;
  }
  console.log(
    `封面重抓完成：${updated}/${targets.length} 集${dryRun ? "（dry-run）" : ""}。`,
  );
  if (updated > 0 && !dryRun) {
    console.log("提醒：檔名固定為 01.jpg，部署後若仍見舊圖請強制重新整理／清 CDN 快取。");
  }
}

async function main(): Promise<void> {
  console.log(dryRun ? "[dry-run] Apple Podcast sync" : "Apple Podcast sync");

  const [synced, state, defaults] = await Promise.all([
    readJson<Story[]>(PATHS.synced, []),
    readJson<SyncState>(PATHS.state, { seenGuids: [], lastRun: null }),
    readJson<SyncDefaults>(PATHS.defaults, {
      vehicle: "其他",
      emoji: "🚗",
      color: "#7048e8",
      tags: [],
      pageCount: APPLE_SYNC_PAGE_COUNT,
      overrides: {},
    }),
  ]);

  const catalog = [...manualStories, ...synced];
  const eps = existingEps(synced);
  const slugs = existingSlugs(synced);

  const feedUrl = await lookupFeedUrl();
  console.log(`Feed: ${feedUrl}`);

  const res = await fetch(feedUrl, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  const rssItems = parseRssEpisodes(xml);
  console.log(`RSS items: ${rssItems.length}`);

  const guidBySlug = state.guidBySlug ?? {};

  // --refresh-cover：只重抓既有集數封面，不跑新集／metadata 同步
  if (refreshCover.enabled) {
    await refreshCovers(catalog, rssItems, guidBySlug, refreshCover.slugs);
    await finishSync();
    return;
  }

  const metadataResult = updateSyncedMetadata(synced, rssItems, defaults, guidBySlug);
  report.metadataUpdated = metadataResult.updatedSlugs;
  if (metadataResult.updatedSlugs.length > 0) {
    console.log(
      `Metadata update: ${metadataResult.updatedSlugs.join(", ")}`,
    );
  }

  const newCandidates = pickNewEpisodes(rssItems, state, catalog, eps, slugs);

  const added: Story[] = [];
  const newGuids: string[] = [];

  for (const { item, ep } of newCandidates) {
    const slug = slugForEpisode(ep);
    const storyDir = path.join(PATHS.storiesPublic, slug);
    const story = rssToStory(item, ep, defaults);

    console.log(`+ EP${ep} ${slug}: ${story.title}`);

    if (dryRun) {
      added.push(story);
      newGuids.push(item.guid);
      eps.add(ep);
      slugs.add(slug);
      continue;
    }

    const dirExists = await fs
      .stat(storyDir)
      .then(() => true)
      .catch(() => false);
    if (dirExists && !force) {
      console.warn(`Skip ${slug}: directory exists (use --force to overwrite assets)`);
      continue;
    }

    await fs.mkdir(storyDir, { recursive: true });

    const audioPath = path.join(storyDir, "audio.mp3");
    const imagePath = path.join(storyDir, "01.jpg");

    console.log(`  Download audio…`);
    await downloadFile(item.audioUrl, audioPath);

    if (item.imageUrl) {
      console.log(`  Download cover…`);
      await downloadAndSaveCover(item.imageUrl, imagePath);
    } else {
      console.warn(`  No cover image for ${slug}; create 01.jpg manually.`);
    }

    maybeTranscribe(slug, audioPath);

    added.push(story);
    newGuids.push(item.guid);
    metadataResult.guidBySlug[slug] = item.guid;
    eps.add(ep);
    slugs.add(slug);
  }

  const hasMetadataChanges = metadataResult.updatedSlugs.length > 0;
  const hasNewEpisodes = added.length > 0;
  const tagBackfill = backfillMissingTags(
    metadataResult.stories,
    defaults,
  );
  const hasTagBackfill = tagBackfill.updatedSlugs.length > 0;
  report.tagBackfill = tagBackfill.updatedSlugs;
  if (hasTagBackfill) {
    console.log(`Tags backfill: ${tagBackfill.updatedSlugs.join(", ")}`);
  }

  const vehicleBackfill = backfillMissingVehicles(
    [...tagBackfill.stories, ...added],
    defaults,
  );
  const hasVehicleBackfill = vehicleBackfill.updatedSlugs.length > 0;
  report.vehicleBackfill = vehicleBackfill.updatedSlugs;
  if (hasVehicleBackfill) {
    console.log(`Vehicle backfill: ${vehicleBackfill.updatedSlugs.join(", ")}`);
  }

  const nextSyncedCatalog = vehicleBackfill.stories.sort((a, b) => b.ep - a.ep);

  report.newEpisodes = added.map((s) => ({
    slug: s.slug,
    ep: s.ep,
    title: s.title,
  }));

  if (dryRun) {
    if (hasNewEpisodes) {
      console.log(
        `[dry-run] Would add ${added.length} episode(s): ${added.map((s) => s.slug).join(", ")}`,
      );
    }
    if (
      !hasMetadataChanges &&
      !hasNewEpisodes &&
      !hasTagBackfill &&
      !hasVehicleBackfill
    ) {
      console.log("[dry-run] No new episodes or metadata changes.");
    }
    await finishSync();
    return;
  }

  const finalCatalog = [...manualStories, ...nextSyncedCatalog];

  if (
    !hasMetadataChanges &&
    !hasNewEpisodes &&
    !hasTagBackfill &&
    !hasVehicleBackfill
  ) {
    console.log("No new episodes or metadata changes.");
    const nextSeen = reconcileSeenGuids(rssItems, state, catalog, eps);
    const seenChanged =
      nextSeen.length !== state.seenGuids.length ||
      nextSeen.some((g) => !state.seenGuids.includes(g));
    const guidChanged =
      Object.keys(metadataResult.guidBySlug).length !==
        Object.keys(guidBySlug).length ||
      Object.entries(metadataResult.guidBySlug).some(
        ([slug, guid]) => guidBySlug[slug] !== guid,
      );
    if (seenChanged || guidChanged) {
      await writeJson(PATHS.state, {
        seenGuids: nextSeen,
        lastRun: new Date().toISOString(),
        guidBySlug: metadataResult.guidBySlug,
      });
    }
    backfillMissingSubtitles(finalCatalog);
    relocalizeCatalogSubtitles(finalCatalog);
    report.subtitlesMissing = listSlugsMissingSubtitles(
      finalCatalog.map((s) => s.slug),
    );
    await finishSync();
    return;
  }

  if (
    !hasMetadataChanges &&
    !hasNewEpisodes &&
    (hasTagBackfill || hasVehicleBackfill)
  ) {
    console.log("No RSS metadata changes; applying profile backfill only.");
  }

  const nextSynced = nextSyncedCatalog;
  await writeJson(PATHS.synced, nextSynced);
  const seenGuids = reconcileSeenGuids(rssItems, state, catalog, eps);
  await writeJson(PATHS.state, {
    seenGuids: [...new Set([...seenGuids, ...newGuids])],
    lastRun: new Date().toISOString(),
    guidBySlug: metadataResult.guidBySlug,
  });

  if (hasNewEpisodes) {
    console.log(`Synced ${added.length} episode(s): ${added.map((s) => s.slug).join(", ")}`);
    console.log(
      "上架框架：pageCount=1、Apple 封面 01.jpg、首頁列表/內頁現行 UI；請視需要於 apple-sync.defaults.json 的 overrides 補 tags / pageCount / captions。",
    );
  }
  if (hasMetadataChanges) {
    console.log(
      `Updated metadata for: ${metadataResult.updatedSlugs.join(", ")}`,
    );
  }

  backfillMissingSubtitles(finalCatalog);
  relocalizeCatalogSubtitles(finalCatalog);
  report.subtitlesMissing = listSlugsMissingSubtitles(
    finalCatalog.map((s) => s.slug),
  );
  await finishSync();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
