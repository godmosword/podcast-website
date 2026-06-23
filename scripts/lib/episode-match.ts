import { slugForEpisode, type RssEpisode } from "./apple-rss";

/**
 * RSS 集數與站上目錄的對照邏輯（sync 與 watchdog 共用，避免行為分歧）。
 * SoundOn 等 feed 常無 itunes:episode 或事後改標題，故以多重對照判斷同一集。
 */

/** 目錄項目最小形狀（Story 結構相容）。 */
export type CatalogEntry = { title: string; ep: number; slug?: string };

export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

/** SoundOn 標題常為「主標｜副標」，副標變更時仍能以主標對到 RSS。 */
export function titleStem(title: string): string {
  const normalized = normalizeTitle(title);
  const pipe = normalized.indexOf("｜");
  if (pipe >= 0) return normalized.slice(0, pipe).trim();
  const asciiPipe = normalized.indexOf("|");
  if (asciiPipe >= 0) return normalized.slice(0, asciiPipe).trim();
  return normalized;
}

/** feed 常無 itunes:episode，改以標題對照既有目錄。 */
export function findCatalogEpByTitle(
  title: string,
  catalog: CatalogEntry[],
): number | null {
  const key = normalizeTitle(title);
  const hit = catalog.find((s) => normalizeTitle(s.title) === key);
  return hit?.ep ?? null;
}

export type OnSiteContext = {
  seenGuids: Set<string>;
  catalog: CatalogEntry[];
  eps: Set<number>;
  slugs: Set<string>;
};

/**
 * RSS 集數是否已在站上（鏡像 sync 的 pickNewEpisodes「不算新集」條件）。
 * guid 已見 / 標題對到目錄 / itunes:episode 已存在 / slug 已存在 → 視為已上站。
 */
export function isRssEpisodeOnSite(
  item: RssEpisode,
  ctx: OnSiteContext,
): boolean {
  if (ctx.seenGuids.has(item.guid)) return true;
  if (findCatalogEpByTitle(item.title, ctx.catalog) != null) return true;
  if (item.episode != null && ctx.eps.has(item.episode)) return true;
  if (item.episode != null && ctx.slugs.has(slugForEpisode(item.episode))) {
    return true;
  }
  return false;
}
