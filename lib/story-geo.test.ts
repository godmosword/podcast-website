import { describe, expect, it, vi } from "vitest";
import { getStories, getStory, storiesByNewest } from "@/data/content";
import { getCharactersForStory } from "@/data/characters";
import {
  familyActivityFaq,
  familyActivityShowNote,
  storyCharactersTeaser,
  storyDefinitionSummary,
  storyFaqs,
  storyOutlineItems,
  storyOutlinePreviewItems,
  storyParentExtension,
  storyZoneMapShowNote,
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

describe("storyOutlinePreviewItems", () => {
  it("預設只取前三點精簡大綱", () => {
    for (const story of getStories()) {
      const preview = storyOutlinePreviewItems(story);
      const full = storyOutlineItems(story);

      expect(preview.length, story.slug).toBeLessThanOrEqual(3);
      expect(preview, story.slug).toEqual(full.slice(0, preview.length));
    }
  });
});

describe("storyCharactersTeaser", () => {
  it("有角色時產生一行摘要", () => {
    const story = storiesByNewest()[0];
    const teaser = storyCharactersTeaser(getCharactersForStory(story.slug));

    expect(teaser.length).toBeGreaterThan(0);
    expect(teaser).toMatch(/本集出場：|故事情境為主/);
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
  it("每集產生 3–4 題 FAQ，皆有非空 Q/A", () => {
    for (const story of getStories()) {
      const faqs = storyFaqs(story);

      expect(faqs.length, story.slug).toBeGreaterThanOrEqual(3);
      expect(faqs.length, story.slug).toBeLessThanOrEqual(4);
      expect(
        faqs.every((faq) => faq.question && faq.answer),
        story.slug,
      ).toBe(true);
    }
  });

  it("有 episodeFaq 時放在最前面，其餘 3 題通用 FAQ 順序不變", () => {
    const story = getStories().find((s) => s.episodeFaq);
    expect(story).toBeDefined();

    const faqs = storyFaqs(story!);

    expect(faqs.length).toBe(4);
    expect(faqs[0]).toEqual(story!.episodeFaq);
    expect(faqs[1].question).toContain("適合");
  });

  it("無 episodeFaq 時維持 3 題通用 FAQ，第一題仍是年齡問題", () => {
    const story = getStories().find((s) => !s.episodeFaq);
    if (!story) return; // 目前集數已全數覆蓋 episodeFaq，保留降級路徑測試

    const faqs = storyFaqs(story);

    expect(faqs.length).toBe(3);
    expect(faqs[0].question).toContain("適合");
  });
});

describe("familyActivity 輸出 helpers", () => {
  it("有 familyActivity 的集數產生 show note 與 FAQ", () => {
    const story = getStory("ep-5");
    expect(story?.familyActivity).toBeDefined();

    const note = familyActivityShowNote(story!);
    expect(note).toContain("🏡 聽完聊一聊：");
    expect(note).toContain(story!.familyActivity!.question);
    expect(note).toContain("延伸小活動：");

    const faq = familyActivityFaq(story!);
    expect(faq?.question).toContain("聊什麼");
    expect(faq?.answer).toContain(story!.familyActivity!.question);
  });

  it("無 familyActivity 的集數回傳 null", () => {
    const story = getStories().find((s) => !s.familyActivity);
    expect(story).toBeDefined();
    expect(familyActivityShowNote(story!)).toBeNull();
    expect(familyActivityFaq(story!)).toBeNull();
  });

  it("有 zoneId 的集數產生地圖 show note", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = getStory("ep-1");
    expect(story?.zoneId).toBe("car-park");
    expect(storyZoneMapShowNote(story!)).toBe(
      "📍 在樂園地圖上看：https://example.com/adventures/car-park",
    );
    vi.unstubAllEnvs();
  });

  it("無 zoneId 的集數 storyZoneMapShowNote 回傳 null", () => {
    // back catalog 已全數對映，改用合成無 zoneId 故事驗證降級路徑
    const base = getStories()[0]!;
    const story = { ...base, zoneId: undefined };
    expect(storyZoneMapShowNote(story)).toBeNull();
  });
});
