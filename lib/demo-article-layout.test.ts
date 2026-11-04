import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { PARENT_ARTICLES } from "@/data/parent-articles";
import {
  DEMO_ARTICLE_SLUG,
  DEMO_B3_BLOCKS,
  DEMO_PARAGRAPHS,
  DEMO_SLOTS,
  DEMO_TITLE_QUOTE,
  demoB3ArticleText,
  demoBodyParagraphs,
} from "./demo-article-layout";

describe("排版示範沿用原文", () => {
  it("正文段落與方格子那篇完全相同，金句也是原文", () => {
    const source = PARENT_ARTICLES.find((entry) => entry.slug === DEMO_ARTICLE_SLUG);
    const sourceParagraphs = source?.blocks.flatMap((block) =>
      block.type === "paragraph" ? [block.text] : [],
    );
    expect(demoBodyParagraphs()).toEqual(sourceParagraphs);
    expect(DEMO_PARAGRAPHS).toContain(DEMO_TITLE_QUOTE);
    let sincePull = 0;
    for (const slot of DEMO_SLOTS) {
      if (slot.kind === "paragraphs") {
        expect(slot.texts.length).toBeGreaterThanOrEqual(2);
        expect(slot.texts.length).toBeLessThanOrEqual(3);
        sincePull += slot.texts.length;
      }
      if (slot.kind === "pull") {
        expect(DEMO_PARAGRAPHS).toContain(slot.text);
        expect(sincePull).toBeGreaterThanOrEqual(2);
        expect(sincePull).toBeLessThanOrEqual(3);
        sincePull = 0;
      }
    }
    expect(sincePull).toBe(0);
  });

  it("B3 只把原文句子接起來，不增刪任何字", () => {
    expect(demoB3ArticleText()).toBe(DEMO_PARAGRAPHS.join(""));
    const subheads = DEMO_B3_BLOCKS.filter((block) => block.kind === "subhead");
    expect(subheads).toHaveLength(2);
    for (const block of DEMO_B3_BLOCKS) {
      if (block.kind === "paragraph") expect(block.texts.length).toBeGreaterThan(0);
    }
  });

  it("示範路由不進 sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/demo/"))).toBe(false);
  });
});
