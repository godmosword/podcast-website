import { describe, expect, it } from "vitest";
import { getStories } from "@/data/content";
import {
  assertFamilyActivityReflectionDistinct,
  assertParentGuideDistinctFromFamilyActivity,
  FAMILY_ACTIVITY_CHANNELS,
  hasDuplicateGuideText,
  PARENT_GUIDE_CHANNELS,
  REFLECTION_PROMPT_CHANNELS,
} from "./geo-content-contract";

describe("geo content channel constants", () => {
  it("familyActivity 通路含家長指南、單集 CTA、RSS、JSON-LD、llms-full", () => {
    expect(FAMILY_ACTIVITY_CHANNELS).toEqual([
      "for-parents-co-listen",
      "story-page-cta",
      "rss-show-note",
      "faq-json-ld-one-item",
      "llms-full",
    ]);
  });

  it("reflectionPrompt 不含 FAQ 或 RSS 通路", () => {
    expect(REFLECTION_PROMPT_CHANNELS).not.toContain("faq-json-ld-one-item");
    expect(REFLECTION_PROMPT_CHANNELS).not.toContain("rss-show-note");
    expect(REFLECTION_PROMPT_CHANNELS).not.toContain("story-page-reflection-prompt");
  });

  it("parentGuide 主通路為家長指南共讀區，非單集預設可見卡片", () => {
    expect(PARENT_GUIDE_CHANNELS[0]).toBe("for-parents-co-listen");
  });
});

describe("hasDuplicateGuideText", () => {
  it("忽略多餘空白後比對", () => {
    expect(hasDuplicateGuideText("你好  世界", "你好 世界")).toBe(true);
    expect(hasDuplicateGuideText("你好", "再見")).toBe(false);
  });
});

describe("assertFamilyActivityReflectionDistinct", () => {
  it("現有故事資料不得讓 familyActivity 與 reflectionPrompt 逐字重複", () => {
    for (const story of getStories()) {
      expect(() => assertFamilyActivityReflectionDistinct(story)).not.toThrow();
    }
  });
});

describe("assertParentGuideDistinctFromFamilyActivity", () => {
  it("偵測 parentGuide 與 familyActivity 逐字重複", () => {
    const story = getStories().find((item) => item.familyActivity);
    expect(story?.familyActivity).toBeDefined();

    expect(() =>
      assertParentGuideDistinctFromFamilyActivity(story!, {
        summary: story!.familyActivity!.question,
        prompts: ["另一句不重複的提問"],
      }),
    ).toThrow(/逐字重複/);

    expect(() =>
      assertParentGuideDistinctFromFamilyActivity(story!, {
        summary: "這集可以聊合作與等待。",
        prompts: ["孩子願意分享時，再問他下次會怎麼選。"],
      }),
    ).not.toThrow();
  });
});
