import { z } from "zod";

/** 機器可讀生圖佇列：Issue／Studio／approve 共用。GHA sync 不寫此檔（不動 Apple sync 白名單）。 */

export const ILLUSTRATION_QUEUE_RELATIVE_PATH = "data/illustration-queue.json";

export const ILLUSTRATION_QUEUE_STATUSES = [
  "awaiting-illustrate",
  "approved",
] as const;

export type IllustrationQueueStatus = (typeof ILLUSTRATION_QUEUE_STATUSES)[number];

export type IllustrationQueueItem = {
  slug: string;
  ep: number;
  syncedAt: string;
  subtitleReady: boolean;
  status: IllustrationQueueStatus;
};

export type IllustrationQueueStory = {
  slug: string;
  ep: number;
  pageCount: number;
  date: string;
};

const itemSchema = z.object({
  slug: z.string().regex(/^ep-\d+$/),
  ep: z.number().int().positive(),
  syncedAt: z.string().min(1),
  subtitleReady: z.boolean(),
  status: z.enum(ILLUSTRATION_QUEUE_STATUSES),
});

export const illustrationQueueFileSchema = z.array(itemSchema);

export function episodeNumberFromSlug(slug: string): number | null {
  const match = /^ep-(\d+)$/.exec(slug);
  if (!match) return null;
  return Number(match[1]);
}

export function isIllustrationSlug(slug: string): boolean {
  return episodeNumberFromSlug(slug) !== null;
}

export function illustrationStatusForPageCount(
  pageCount: number,
): IllustrationQueueStatus {
  return pageCount <= 1 ? "awaiting-illustrate" : "approved";
}

export function proofreadMarkerRelPath(slug: string): string {
  return `data/subtitles/_proofread/${slug}.json`;
}

export function syncedAtFromStoryDate(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return `${date}T00:00:00+08:00`;
  return date;
}

export function parseIllustrationQueue(raw: unknown): IllustrationQueueItem[] {
  return illustrationQueueFileSchema.parse(raw);
}

function sortByEpDesc(items: IllustrationQueueItem[]): IllustrationQueueItem[] {
  return [...items].sort((a, b) => b.ep - a.ep);
}

/**
 * catalog 為準：pageCount≤1 → 待生圖；已全幕且 overlay 沒記過的不灌進檔案。
 * overlay 保留 syncedAt；subtitleReady 以注入的即時檢查為準。
 */
export function reconcileIllustrationQueue(input: {
  stories: IllustrationQueueStory[];
  overlay: IllustrationQueueItem[];
  isSubtitleReady: (slug: string) => boolean;
}): IllustrationQueueItem[] {
  const overlayBySlug = new Map(input.overlay.map((item) => [item.slug, item]));
  const items: IllustrationQueueItem[] = [];

  for (const story of input.stories) {
    if (!isIllustrationSlug(story.slug)) continue;
    const status = illustrationStatusForPageCount(story.pageCount);
    const prev = overlayBySlug.get(story.slug);
    if (status === "approved" && !prev) continue;

    items.push({
      slug: story.slug,
      ep: story.ep,
      syncedAt: prev?.syncedAt ?? syncedAtFromStoryDate(story.date),
      subtitleReady: input.isSubtitleReady(story.slug),
      status,
    });
  }

  return sortByEpDesc(items);
}

export function listAwaitingIllustrations(
  items: IllustrationQueueItem[],
): IllustrationQueueItem[] {
  return items.filter((item) => item.status === "awaiting-illustrate");
}

export function upsertAwaiting(
  overlay: IllustrationQueueItem[],
  incoming: Array<{ slug: string; ep: number; syncedAt: string }>,
  isSubtitleReady: (slug: string) => boolean,
): IllustrationQueueItem[] {
  const bySlug = new Map(overlay.map((item) => [item.slug, item]));

  for (const next of incoming) {
    if (!isIllustrationSlug(next.slug)) continue;
    const existing = bySlug.get(next.slug);
    if (existing?.status === "approved") continue;
    bySlug.set(next.slug, {
      slug: next.slug,
      ep: next.ep,
      syncedAt: next.syncedAt,
      subtitleReady: isSubtitleReady(next.slug),
      status: "awaiting-illustrate",
    });
  }

  return sortByEpDesc([...bySlug.values()]);
}

export function markApproved(
  overlay: IllustrationQueueItem[],
  slug: string,
  meta: { ep: number; syncedAt?: string; subtitleReady?: boolean },
): IllustrationQueueItem[] {
  const bySlug = new Map(overlay.map((item) => [item.slug, item]));
  const existing = bySlug.get(slug);
  bySlug.set(slug, {
    slug,
    ep: meta.ep,
    syncedAt: meta.syncedAt ?? existing?.syncedAt ?? new Date().toISOString(),
    subtitleReady: meta.subtitleReady ?? existing?.subtitleReady ?? true,
    status: "approved",
  });
  return sortByEpDesc([...bySlug.values()]);
}
