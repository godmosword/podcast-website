import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARENT_ARTICLE_SERIES } from "@/data/parent-article-series";
import { PARENT_ARTICLES, type ParentArticle } from "@/data/parent-articles";
import {
  formatParentArticleDate,
  getParentArticle,
  listParentArticles,
  parentArticleMonthLabel,
  parentArticleNeighbors,
  parentArticlePath,
  parentArticleReadingMinutes,
  parentArticlesLayout,
} from "./parent-articles";

function article(
  slug: string,
  publishedAt: string,
  text = "一段話",
): ParentArticle {
  return {
    slug,
    title: slug,
    publishedAt,
    sourceUrl: `https://vocus.cc/post/${slug}`,
    excerpt: text,
    blocks: [{ type: "paragraph", text }],
  };
}

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

describe("parentArticleReadingMinutes", () => {
  it("依字數估分鐘，最少 1 分鐘，空白不算字", () => {
    expect(parentArticleReadingMinutes(article("a", "2026-01-01", "短"))).toBe(1);
    expect(
      parentArticleReadingMinutes(article("b", "2026-01-01", "字".repeat(1400))),
    ).toBe(4);
    expect(
      parentArticleReadingMinutes(article("c", "2026-01-01", " \n".repeat(900))),
    ).toBe(1);
  });

  it("標題與清單也算進去", () => {
    const withList: ParentArticle = {
      ...article("d", "2026-01-01", "字".repeat(350)),
      blocks: [
        { type: "heading", level: 2, text: "字".repeat(350) },
        { type: "list", items: ["字".repeat(350), "字".repeat(350)] },
      ],
    };
    expect(parentArticleReadingMinutes(withList)).toBe(3);
  });

  it("現有四篇都約 1 分鐘", () => {
    for (const entry of PARENT_ARTICLES) {
      expect(parentArticleReadingMinutes(entry), entry.slug).toBe(1);
    }
  });
});

describe("parentArticlesLayout", () => {
  it("線上資料：最新是情緒那篇，視力三篇照順序成一組，沒有其他文章", () => {
    const layout = parentArticlesLayout();
    expect(layout.latest?.slug).toBe("vocus-6ad06360fd89780001c70f77");
    expect(layout.series).toHaveLength(1);
    expect(layout.series[0].title).toBe("注意孩子的視力");
    expect(layout.series[0].articles.map((a) => a.slug)).toEqual([
      "vision-care-1",
      "vision-care-2",
      "vision-care-3",
    ]);
    expect(layout.months).toEqual([]);
  });

  it("其他文章依月份分組、新到舊，且不重複出現在最新或系列", () => {
    const articles = [
      article("s1", "2026-03-01"),
      article("s2", "2026-03-02"),
      article("old", "2026-01-05"),
      article("mid-a", "2026-02-10"),
      article("mid-b", "2026-02-20"),
      article("new", "2026-04-01"),
    ];
    const layout = parentArticlesLayout(articles, [
      { id: "s", title: "系列", slugs: ["s1", "s2"] },
    ]);
    expect(layout.latest?.slug).toBe("new");
    expect(layout.series[0].articles.map((a) => a.slug)).toEqual(["s1", "s2"]);
    expect(layout.months.map((m) => [m.key, m.articles.map((a) => a.slug)])).toEqual([
      ["2026-02", ["mid-b", "mid-a"]],
      ["2026-01", ["old"]],
    ]);
  });

  it("同一天發布時，陣列裡較後面的算最新", () => {
    const layout = parentArticlesLayout(
      [article("first", "2026-05-01"), article("second", "2026-05-01")],
      [],
    );
    expect(layout.latest?.slug).toBe("second");
    expect(layout.months[0].articles.map((a) => a.slug)).toEqual(["first"]);
  });

  it("系列找不到的 slug 略過，整組都找不到就不顯示", () => {
    const layout = parentArticlesLayout(
      [article("a", "2026-05-01"), article("b", "2026-05-02")],
      [
        { id: "x", title: "缺一篇", slugs: ["a", "missing"] },
        { id: "y", title: "全缺", slugs: ["nope"] },
      ],
    );
    expect(layout.series.map((s) => [s.id, s.articles.map((a) => a.slug)])).toEqual([
      ["x", ["a"]],
    ]);
  });

  it("沒有文章時什麼都沒有", () => {
    expect(parentArticlesLayout([], [])).toEqual({
      latest: null,
      series: [],
      months: [],
    });
  });

  it("月份標題", () => {
    expect(parentArticleMonthLabel("2026-09")).toBe("2026 年 9 月");
    expect(parentArticleMonthLabel("2026-10")).toBe("2026 年 10 月");
  });
});

describe("PARENT_ARTICLE_SERIES", () => {
  it("每個 slug 都找得到文章，一篇只屬於一個系列", () => {
    const seen = new Set<string>();
    for (const series of PARENT_ARTICLE_SERIES) {
      for (const slug of series.slugs) {
        expect(getParentArticle(slug), `${series.id}: ${slug}`).toBeDefined();
        expect(seen.has(slug), `${slug} 重複`).toBe(false);
        seen.add(slug);
      }
    }
  });

  it("系列表不能放進 data/parent-articles.ts：同步腳本用最後一個 `];` 找插入點", () => {
    const source = readFileSync(
      join(import.meta.dirname, "../data/parent-articles.ts"),
      "utf8",
    );
    const start = source.indexOf("export const PARENT_ARTICLES");
    expect(start).toBeGreaterThan(0);
    // PARENT_ARTICLES 之後的頂層（不縮排）只能是它自己的宣告與結尾 `];`。
    const topLevel = source
      .slice(start)
      .split("\n")
      .filter((line) => line !== "" && !/^\s/.test(line));
    expect(topLevel).toEqual([
      "export const PARENT_ARTICLES: readonly ParentArticle[] = [",
      "];",
    ]);
  });
});
