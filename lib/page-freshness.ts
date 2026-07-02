import type { Story } from "@/data/content";
import {
  STATIC_PAGE_MODIFIED_DATES,
  STATIC_PAGE_MODIFIED_DATE_SOURCE,
} from "@/data/page-freshness-dates";
import { storyDateModified } from "@/data/story-dates";

/** 全站結構性基準時間；用作 sitemap 集合 freshness 的下限與 fallback。 */
export const SITE_STRUCTURE_MODIFIED = "2026-07-02T00:00:00+08:00";

export { STATIC_PAGE_MODIFIED_DATES, STATIC_PAGE_MODIFIED_DATE_SOURCE };

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
