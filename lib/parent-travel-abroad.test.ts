import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";
import { PARENT_ARTICLES } from "@/data/parent-articles";
import { PARENT_TRAVEL_ABROAD_ARTICLES } from "@/data/parent-travel-abroad-articles";
import { listParentArticles } from "./parent-articles";
import {
  TRAVEL_ABROAD_LEDE,
  getTravelAbroadArticle,
  listTravelAbroadArticles,
  listTravelAbroadArticlesByRecency,
  travelAbroadArticlePath,
  travelAbroadLocationRedirects,
} from "./parent-travel-abroad";

describe("親子出國文章", () => {
  it("跟育兒文章的 slug、原文網址都不重複，頁面上沒有標記", () => {
    const parentSlugs = new Set(listParentArticles().map((article) => article.slug));
    const parentUrls = new Set(listParentArticles().map((article) => article.sourceUrl));
    expect(listTravelAbroadArticles().length).toBeGreaterThan(0);
    for (const article of listTravelAbroadArticles()) {
      expect(parentSlugs.has(article.slug)).toBe(false);
      expect(parentUrls.has(article.sourceUrl)).toBe(false);
      expect(travelAbroadArticlePath(article.slug)).toBe(
        `/for-parents/travel-abroad/${article.slug}`,
      );
      expect(JSON.stringify(article.blocks)).not.toContain("同步更新至親子出國專欄");
      expect(article.excerpt).not.toContain("同步更新至親子出國專欄");
      expect(article.sourceUrl.startsWith("https://vocus.cc/")).toBe(true);
    }
    expect(getTravelAbroadArticle("travel-abroad-sample")?.title).toBe("親子出國專欄範例");
    expect(listTravelAbroadArticlesByRecency()[0]?.slug).toBe("travel-abroad-sample");
    expect(TRAVEL_ABROAD_LEDE).toBe("親子出國的準備與行程。");
  });

  it("資料檔在陣列後面不再加別的陣列，舊網址會轉到現在的區", () => {
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

    const redirects = travelAbroadLocationRedirects();
    expect(redirects).toContainEqual({
      source: "/for-parents/articles/travel-abroad-sample",
      destination: "/for-parents/travel-abroad/travel-abroad-sample",
      permanent: true,
    });
    expect(redirects).toContainEqual({
      source: "/for-parents/travel-abroad/vision-care-1",
      destination: "/for-parents/articles/vision-care-1",
      permanent: true,
    });
    expect(redirects).toHaveLength(
      PARENT_TRAVEL_ABROAD_ARTICLES.length + PARENT_ARTICLES.length,
    );
  });

  it("next.config 有掛上這組轉址", async () => {
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        {
          source: "/for-parents/articles/travel-abroad-sample",
          destination: "/for-parents/travel-abroad/travel-abroad-sample",
          permanent: true,
        },
      ]),
    );
  });
});
