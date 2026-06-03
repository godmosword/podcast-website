#!/usr/bin/env npx tsx
/**
 * 從 Apple Podcast RSS 同步新集到 data/apple-synced.json 與 public/stories/<slug>/。
 * 用法：npm run sync:apple [-- --dry-run] [-- --force]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Story } from "../data/stories";
import { manualStories } from "../data/stories";
import { lookupFeedUrl } from "../lib/podcast-apple";
import {
  parseRssEpisodes,
  pubDateToIsoDate,
  slugForEpisode,
  stripHtml,
  type RssEpisode,
} from "./lib/apple-rss";

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
};

type SyncDefaults = {
  vehicle: string;
  emoji: string;
  color: string;
  tags: string[];
  overrides: Record<string, Partial<Story>>;
};

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

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

function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

/** SoundOn 等 feed 常無 itunes:episode，改以標題對照既有目錄。 */
function findCatalogEpByTitle(title: string, catalog: Story[]): number | null {
  const key = normalizeTitle(title);
  const hit = catalog.find((s) => normalizeTitle(s.title) === key);
  return hit?.ep ?? null;
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
    color: override.color ?? defaults.color,
    tags: override.tags ?? defaults.tags,
    ...(override.summary !== undefined ? { summary: override.summary } : {}),
    ...(override.ageRange !== undefined ? { ageRange: override.ageRange } : {}),
    ...(override.captions !== undefined ? { captions: override.captions } : {}),
    ...(override.duration !== undefined ? { duration: override.duration } : {}),
    ...(override.pageCount !== undefined ? { pageCount: override.pageCount } : {}),
  };
}

function rssToStory(
  item: RssEpisode,
  ep: number,
  defaults: SyncDefaults,
): Story {
  const slug = slugForEpisode(ep);
  const summary = stripHtml(item.description).slice(0, 500) || undefined;
  const base: Story = {
    slug,
    ep,
    title: item.title,
    date: pubDateToIsoDate(item.pubDate),
    duration: item.duration ?? undefined,
    vehicle: defaults.vehicle,
    emoji: defaults.emoji,
    color: defaults.color,
    audio: "audio.mp3",
    pageCount: 1,
    summary,
    tags: [...defaults.tags],
  };
  return applyDefaults(base, defaults);
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

type NewEpisodeCandidate = { item: RssEpisode; ep: number };

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

  const newCandidates = pickNewEpisodes(rssItems, state, catalog, eps, slugs);
  if (newCandidates.length === 0) {
    console.log("No new episodes to sync.");
    if (!dryRun) {
      await writeJson(PATHS.state, {
        seenGuids: reconcileSeenGuids(rssItems, state, catalog, eps),
        lastRun: new Date().toISOString(),
      });
    }
    return;
  }

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
      await downloadFile(item.imageUrl, imagePath);
    } else {
      console.warn(`  No cover image for ${slug}; create 01.jpg manually.`);
    }

    added.push(story);
    newGuids.push(item.guid);
    eps.add(ep);
    slugs.add(slug);
  }

  if (dryRun) {
    console.log(`[dry-run] Would add ${added.length} episode(s): ${added.map((s) => s.slug).join(", ")}`);
    return;
  }

  if (added.length === 0) {
    console.log("Nothing written.");
    return;
  }

  const nextSynced = [...synced, ...added].sort((a, b) => b.ep - a.ep);
  await writeJson(PATHS.synced, nextSynced);
  const seenGuids = reconcileSeenGuids(rssItems, state, catalog, eps);
  await writeJson(PATHS.state, {
    seenGuids: [...new Set([...seenGuids, ...newGuids])],
    lastRun: new Date().toISOString(),
  });

  console.log(`Synced ${added.length} episode(s): ${added.map((s) => s.slug).join(", ")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
