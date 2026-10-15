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
  it("視力系列維持一、二、三，同步的新文接在後面", () => {
    expect(listParentArticles().map((article) => article.title).slice(0, 4)).toEqual([
      "注意孩子的視力保健（ㄧ）",
      "注意孩子的視力（二）",
      "注意孩子的視力（三）",
      "當孩子的情緒像小火山爆發時，該怎麼辦？",
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

  it("每篇都有方格子原文連結與台北發布日", () => {
    for (const article of PARENT_ARTICLES) {
      expect(article.sourceUrl).toBe(
        `https://vocus.cc/post/${article.sourceUrl.split("/").pop()}`,
      );
      expect(article.sourceUrl).toMatch(/^https:\/\/vocus\.cc\/post\/[a-f0-9]{24}$/);
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (article.coverImage) {
        expect(article.coverImage.startsWith("/parent-articles/")).toBe(true);
      }
      expect(getParentArticle(article.slug)?.title).toBe(article.title);
      expect(parentArticlePath(article.slug)).toBe(
        `/for-parents/articles/${article.slug}`,
      );
    }
    for (const slug of ["vision-care-1", "vision-care-2", "vision-care-3"]) {
      expect(getParentArticle(slug)?.publishedAt).toBe("2026-09-12");
    }
    expect(getParentArticle("vocus-6ad06360fd89780001c70f77")?.publishedAt).toBe(
      "2026-10-15",
    );
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
      next: { slug: "vocus-6ad06360fd89780001c70f77" },
    });
    expect(
      parentArticleNeighbors("vocus-6ad06360fd89780001c70f77").previous?.slug,
    ).toBe("vision-care-3");
    expect(formatParentArticleDate("2026-09-12")).toBe("2026年9月12日");
    expect(formatParentArticleDate("2026-10-15")).toBe("2026年10月15日");
  });
});
