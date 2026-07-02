import type { Story } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";

/** GEO 頁面與全站結構在 2026-07-02 本次實作中新增/更新。 */
export const SITE_STRUCTURE_MODIFIED = "2026-07-02T00:00:00+08:00";

export const STATIC_PAGE_MODIFIED_DATES: Record<string, string> = {
  "/about": SITE_STRUCTURE_MODIFIED,
  "/adventures": SITE_STRUCTURE_MODIFIED,
  "/characters": SITE_STRUCTURE_MODIFIED,
  "/for-parents": SITE_STRUCTURE_MODIFIED,
  "/games": SITE_STRUCTURE_MODIFIED,
  "/games/block-drop": SITE_STRUCTURE_MODIFIED,
  "/games/car-adventure": SITE_STRUCTURE_MODIFIED,
  "/games/candy-kart": SITE_STRUCTURE_MODIFIED,
  "/games/candy-match": SITE_STRUCTURE_MODIFIED,
  "/legal": "2026-06-10T00:00:00+08:00",
};

export function latestStoryModified(stories: Story[]): string {
  return stories
    .map((story) => storyDateModified(story))
    .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? SITE_STRUCTURE_MODIFIED;
}

export function collectionModifiedDate(stories: Story[]): string {
  const latest = latestStoryModified(stories);
  return Date.parse(SITE_STRUCTURE_MODIFIED) > Date.parse(latest)
    ? SITE_STRUCTURE_MODIFIED
    : latest;
}
