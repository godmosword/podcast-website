import { describe, expect, it } from "vitest";
import { PARENT_ARTICLES } from "@/data/parent-articles";
import {
  formatParentArticleDate,
  getParentArticle,
  listParentArticles,
  parentArticleNeighbors,
  parentArticlePath,
} from "./parent-articles";

describe("parent articles", () => {
  it("依視力系列一、二、三的閱讀順序排列", () => {
    expect(listParentArticles().map((article) => article.title)).toEqual([
      "注意孩子的視力保健（ㄧ）",
      "注意孩子的視力（二）",
      "注意孩子的視力（三）",
    ]);
  });

  it("摘要是原文開頭，且內文不含物件替代字元", () => {
    for (const article of PARENT_ARTICLES) {
      const opening = article.blocks.flatMap((block) => {
        if (block.type !== "paragraph") return [];
        return [block.text];
      });
      const firstSpacer = article.blocks.findIndex((block) => block.type === "spacer");
      const stanza = opening.slice(0, firstSpacer === -1 ? opening.length : firstSpacer);
      expect(article.excerpt).toBe(stanza.join("\n"));
      expect(article.excerpt.length).toBeGreaterThan(0);
      for (const block of article.blocks) {
        if (block.type === "paragraph" || block.type === "heading") {
          expect(block.text).not.toContain("\uFFFC");
        }
      }
    }
  });

  it("每篇都有方格子原文連結、發布日，且目前沒有封面圖", () => {
    for (const article of PARENT_ARTICLES) {
      expect(article.sourceUrl).toBe(
        `https://vocus.cc/post/${article.sourceUrl.split("/").pop()}`,
      );
      expect(article.sourceUrl.startsWith("https://vocus.cc/post/")).toBe(true);
      expect(article.publishedAt).toBe("2026-09-12");
      expect(article.coverImage).toBeUndefined();
      expect(getParentArticle(article.slug)?.title).toBe(article.title);
      expect(parentArticlePath(article.slug)).toBe(
        `/for-parents/articles/${article.slug}`,
      );
    }
  });

  it("系列內上一篇與下一篇相鄰", () => {
    expect(parentArticleNeighbors("vision-care-1")).toMatchObject({
      previous: null,
      next: { slug: "vision-care-2" },
    });
    expect(parentArticleNeighbors("vision-care-2")).toMatchObject({
      previous: { slug: "vision-care-1" },
      next: { slug: "vision-care-3" },
    });
    expect(parentArticleNeighbors("vision-care-3")).toMatchObject({
      previous: { slug: "vision-care-2" },
      next: null,
    });
    expect(formatParentArticleDate("2026-09-12")).toBe("2026年9月12日");
  });
});
