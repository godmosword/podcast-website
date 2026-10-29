import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import type { ParentArticle } from "@/data/parent-articles";
import { PARENT_ARTICLES } from "@/data/parent-articles";
import { listParentArticles } from "./parent-articles";
import {
  getTravelAbroadArticle,
  listTravelAbroadArticles,
  travelAbroadArticlePath,
  travelAbroadArticlesByRecency,
  travelAbroadLocationRedirects,
} from "./parent-travel-abroad";

function fixture(slug: string, publishedAt: string): ParentArticle {
  return {
    slug,
    title: `測試 ${slug}`,
    publishedAt,
    sourceUrl: `https://vocus.cc/post/${slug}`,
    excerpt: "測試用摘要",
    blocks: [{ type: "paragraph", text: "測試用摘要" }],
  };
}

describe("親子出國文章", () => {
  it("小松那篇在親子出國，不和育兒文章重複，頁面上沒有標記", () => {
    const parentSlugs = new Set(listParentArticles().map((article) => article.slug));
    const parentUrls = new Set(listParentArticles().map((article) => article.sourceUrl));
    const article = getTravelAbroadArticle("vocus-6ae34027fd897800012f3e51");
    expect(article?.title).toContain("小松之杜");
    expect(article?.sourceUrl).toBe(
      "https://vocus.cc/article/6ae34027fd897800012f3e51",
    );
    expect(article?.coverImage).toBe(
      "/parent-articles/vocus-6ae34027fd897800012f3e51-cover.webp",
    );
    expect(article?.coverAlt).toBe("小松 PC4000 大型怪手前，大人與小孩的背影");
    expect(getTravelAbroadArticle("travel-abroad-sample")).toBeUndefined();
    for (const entry of listTravelAbroadArticles()) {
      expect(parentSlugs.has(entry.slug)).toBe(false);
      expect(parentUrls.has(entry.sourceUrl)).toBe(false);
      expect(JSON.stringify(entry.blocks)).not.toContain("同步更新至親子出國專欄");
      expect(travelAbroadArticlePath(entry.slug)).toBe(
        `/for-parents/travel-abroad/${entry.slug}`,
      );
    }
  });

  it("列表排序用測試文章：發布日新的在前，同一天較晚放進陣列的在前", () => {
    const ordered = travelAbroadArticlesByRecency([
      fixture("older", "2026-01-01"),
      fixture("same-early", "2026-06-01"),
      fixture("same-late", "2026-06-01"),
      fixture("newer", "2026-10-01"),
    ]);
    expect(ordered.map((article) => article.slug)).toEqual([
      "newer",
      "same-late",
      "same-early",
      "older",
    ]);
    expect(travelAbroadArticlePath("newer")).toBe("/for-parents/travel-abroad/newer");
  });

  it("資料檔在陣列後面不再加別的陣列；育兒文章的舊網址轉回育兒文章", () => {
    const source = readFileSync(
      join(import.meta.dirname, "../data/parent-travel-abroad-articles.ts"),
      "utf8",
    );
    const start = source.indexOf("export const PARENT_TRAVEL_ABROAD_ARTICLES");
    const topLevel = source
      .slice(start)
      .split("\n")
      .filter((line) => line !== "" && !/^\s/.test(line));
    expect(topLevel).toEqual([
      "export const PARENT_TRAVEL_ABROAD_ARTICLES: readonly ParentArticle[] = [",
      "];",
    ]);
    expect(source).not.toContain("travel-abroad-sample");

    const redirects = travelAbroadLocationRedirects();
    expect(redirects).toContainEqual({
      source: "/for-parents/travel-abroad/vision-care-1",
      destination: "/for-parents/articles/vision-care-1",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/for-parents/articles/vocus-6ae34027fd897800012f3e51",
      destination: "/for-parents/travel-abroad/vocus-6ae34027fd897800012f3e51",
      permanent: true,
    });
    expect(redirects).toHaveLength(
      PARENT_ARTICLES.length + listTravelAbroadArticles().length,
    );
  });

  it("next.config 有掛上育兒文章的轉址", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/for-parents/articles/vocus-6ae34027fd897800012f3e51",
          destination: "/for-parents/travel-abroad/vocus-6ae34027fd897800012f3e51",
          permanent: true,
        },
      ]),
    );
    expect(redirects?.some((entry) => entry.source.includes("travel-abroad-sample"))).toBe(
      false,
    );
  });
});
