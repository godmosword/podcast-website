import type { Story } from "@/data/content";
import { storiesByNewest } from "@/data/content";
import { storyDisplayTitle } from "@/lib/story-title";

/**
 * 繪本故事＝全幕繪本。
 * 依據 docs/EPISODE-WORKFLOW.md「必備產物（全幕繪本，pageCount > 1）」：
 * 幕數、插圖、captionTimes、captions 都齊，播放器可以左右翻頁。
 * pageCount 為 1 的集只有 Apple 封面，還不能翻頁，先不收。
 * 「水泥車阿尼的101任務」（ep-20）固定排第一，其餘沿用全站由新到舊。
 */
export const PICTURE_BOOK_PINNED_SLUG = "ep-20";

export function isPictureBookStory(story: Pick<Story, "pageCount">): boolean {
  return story.pageCount > 1;
}

export function pictureBookStories(
  stories: readonly Story[] = storiesByNewest(),
): Story[] {
  const books = stories.filter(isPictureBookStory);
  const pinned = books.filter((story) => story.slug === PICTURE_BOOK_PINNED_SLUG);
  const rest = books.filter((story) => story.slug !== PICTURE_BOOK_PINNED_SLUG);
  return [...pinned, ...rest];
}

export function pictureBookVehicles(stories: readonly Story[]): string[] {
  return Array.from(new Set(stories.map((story) => story.vehicle)));
}

export function pictureBookCatalogSummary(stories: readonly Story[]): string {
  const first = stories[0];
  const lead = first ? `排第一的是「${storyDisplayTitle(first)}」。` : "";
  return `這頁是車車遊樂園可以左右翻頁的繪本故事，共 ${stories.length} 則。${lead}適合約 3–7 歲的孩子一邊聽、一邊看圖。`;
}
