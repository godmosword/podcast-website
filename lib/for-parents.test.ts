import { describe, expect, it } from "vitest";
import { getCharacters } from "@/data/characters";
import { getStories } from "@/data/content";
import {
  parentLandingFacts,
  parentLandingFaqs,
  representativeParentStories,
} from "./for-parents";

describe("parentLandingFacts", () => {
  it("從資料層計算 GEO landing 需要的真實數字", () => {
    const facts = parentLandingFacts();

    expect(facts.episodeCount).toBe(getStories().length);
    expect(facts.characterCount).toBe(getCharacters().length);
    expect(facts.latestStory.slug).toBe(getStories().sort((a, b) => b.ep - a.ep)[0].slug);
    expect(facts.language).toBe("繁體中文");
  });
});

describe("parentLandingFaqs", () => {
  it("包含家長常問的目標查詢與待確認數字", () => {
    const facts = parentLandingFacts();
    const faqs = parentLandingFaqs(facts);

    expect(faqs.length).toBeGreaterThanOrEqual(3);
    expect(faqs.map((faq) => faq.question)).toEqual(
      expect.arrayContaining([
        "有哪些適合 3–6 歲的中文車車 Podcast？",
        "車車遊樂園是什麼？",
        "如何陪孩子一起聽？",
      ]),
    );
    expect(faqs[0].answer).toContain(`[待確認：${facts.episodeCount} 集]`);
    expect(faqs[0].answer).toContain("[待確認：約 3–7 歲]");
  });
});

describe("representativeParentStories", () => {
  it("回傳真實存在的代表性集數", () => {
    const stories = representativeParentStories();
    const allSlugs = new Set(getStories().map((story) => story.slug));

    expect(stories.length).toBeGreaterThanOrEqual(3);
    expect(stories.every((story) => allSlugs.has(story.slug))).toBe(true);
  });
});
