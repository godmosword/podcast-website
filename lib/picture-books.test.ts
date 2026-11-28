import { describe, expect, it, vi } from "vitest";
import { getStories } from "@/data/content";
import { pictureBookListJsonLd } from "@/lib/json-ld";
import {
  PICTURE_BOOK_PINNED_SLUG,
  isPictureBookStory,
  pictureBookCatalogSummary,
  pictureBookStories,
} from "./picture-books";

describe("pictureBookStories", () => {
  const all = getStories();
  const books = pictureBookStories(all);

  it("只收 pageCount > 1 的全幕繪本", () => {
    const singles = all.filter((story) => !isPictureBookStory(story));
    expect(singles.length).toBeGreaterThan(0);
    expect(books.every((story) => story.pageCount > 1)).toBe(true);
    expect(books.some((story) => singles.some((single) => single.slug === story.slug))).toBe(
      false,
    );
  });

  it("水泥車阿尼的101任務排第一，其餘由新到舊", () => {
    expect(books[0]?.slug).toBe(PICTURE_BOOK_PINNED_SLUG);
    expect(books[0]?.title.startsWith("水泥車阿尼的101任務")).toBe(true);
    const rest = books.slice(1);
    const eps = rest.map((story) => story.ep);
    expect(eps).toEqual([...eps].sort((a, b) => b - a));
    expect(rest.some((story) => story.slug === PICTURE_BOOK_PINNED_SLUG)).toBe(false);
  });

  it("導言點出第一則與總數", () => {
    const summary = pictureBookCatalogSummary(books);
    expect(summary).toContain(`共 ${books.length} 則`);
    expect(summary).toContain("水泥車阿尼的101任務");
    expect(summary).toContain("適合約 3–7 歲親子共聽");
    expect(summary).not.toContain("一邊聽、一邊看圖");
  });

  it("JSON-LD 第一則連到阿尼", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const data = pictureBookListJsonLd(books);
    const items = data.itemListElement as { position: number; url: string }[];
    expect(data.numberOfItems).toBe(books.length);
    expect(items[0]).toMatchObject({
      position: 1,
      url: "https://example.com/story/ep-20",
    });
    vi.unstubAllEnvs();
  });
});
