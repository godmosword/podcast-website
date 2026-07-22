import { describe, expect, it } from "vitest";
import { getCharacters } from "@/data/characters";
import { getStories } from "@/data/content";
import {
  parentCoListenStories,
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
    expect(facts.ageRange).toBe("約 3–7 歲");
    expect(facts.syncCadence).toContain("15 分鐘");
  });
});

describe("parentLandingFaqs", () => {
  it("包含家長常問的目標查詢與資料層直出數字", () => {
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
    expect(faqs[0].answer).toContain(`${facts.episodeCount} 集`);
    expect(faqs[0].answer).toContain("約 3–7 歲");
    expect(faqs[0].answer).not.toContain("待確認");
    expect(faqs[1].answer).toContain(`${facts.characterCount} 位角色`);
    expect(faqs[1].answer).not.toContain("待確認");
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

describe("parentCoListenStories", () => {
  it("只含有共讀／活動／反思文案的集數", () => {
    const stories = parentCoListenStories();
    expect(stories.length).toBeGreaterThan(0);
    expect(
      stories.every(
        (story) =>
          Boolean(story.familyActivity) ||
          Boolean(story.parentGuide) ||
          Boolean(story.reflectionPrompt),
      ),
    ).toBe(true);
  });
});
