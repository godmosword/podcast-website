import { describe, expect, it } from "vitest";
import { getStories, storiesByNewest } from "@/data/content";
import {
  storyDefinitionSummary,
  storyFaqs,
  storyOutlineItems,
  storyParentExtension,
} from "./story-geo";

describe("storyDefinitionSummary", () => {
  it("每集產生 80–120 字的 answer-first 摘要", () => {
    for (const story of getStories()) {
      const summary = storyDefinitionSummary(story);
      const length = Array.from(summary).length;

      expect(length, story.slug).toBeGreaterThanOrEqual(80);
      expect(length, story.slug).toBeLessThanOrEqual(120);
      expect(summary, story.slug).toContain(`第 ${story.ep} 集`);
      expect(summary, story.slug).toContain("適合");
    }
  });

  it("不把社群導流和網址帶進定義式摘要", () => {
    const summary = storyDefinitionSummary(storiesByNewest()[0]);

    expect(summary).not.toMatch(/https?:|IG|threads|FB|五星|留言|許願/);
  });
});

describe("storyOutlineItems", () => {
  it("每集都有 SSR 可見的大綱或字幕項目", () => {
    for (const story of getStories()) {
      const outline = storyOutlineItems(story);
      expect(outline.length, story.slug).toBeGreaterThanOrEqual(3);
      expect(outline.every((line) => line.trim().length > 0), story.slug).toBe(
        true,
      );
    }
  });
});

describe("storyParentExtension", () => {
  it("提供家長延伸共聽指引", () => {
    const story = storiesByNewest()[0];
    const extension = storyParentExtension(story);

    expect(extension.heading).toMatch(/家長/);
    expect(extension.prompts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("storyFaqs", () => {
  it("每集產生 2–3 題 FAQ", () => {
    const story = storiesByNewest()[0];
    const faqs = storyFaqs(story);

    expect(faqs.length).toBeGreaterThanOrEqual(2);
    expect(faqs.length).toBeLessThanOrEqual(3);
    expect(faqs[0].question).toContain("適合");
    expect(faqs.every((faq) => faq.question && faq.answer)).toBe(true);
  });
});
