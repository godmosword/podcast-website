import { describe, expect, it } from "vitest";
import { getFamilyActivity } from "./family-activities";
import { getParentGuide } from "./parent-guides";
import { getReflectionPrompt } from "./reflection-prompts";
import {
  episodeFaqCoverage,
  getEpisodeFaq,
  listEpisodeFaqSlugs,
} from "./episode-faqs";
import { getStories, getStory } from "./content";
import { hasDuplicateGuideText } from "@/lib/geo-content-contract";
import { storyFaqs } from "@/lib/story-geo";

function chars(text: string): number {
  return Array.from(text).length;
}

describe("episode-faqs sidecar", () => {
  it("已定義的集數皆有非空 Q/A，且答案長度落在約 50–170 字之間", () => {
    for (const slug of listEpisodeFaqSlugs()) {
      const faq = getEpisodeFaq(slug);
      expect(faq?.question.trim().length, slug).toBeGreaterThan(0);
      expect(faq?.answer.trim().length, slug).toBeGreaterThan(0);
      expect(chars(faq!.answer), slug).toBeGreaterThanOrEqual(50);
      expect(chars(faq!.answer), slug).toBeLessThanOrEqual(170);
      expect(getStory(slug), slug).toBeDefined();
    }
  });

  it("未定義的 slug 回傳 undefined", () => {
    expect(getEpisodeFaq("ep-not-exist")).toBeUndefined();
  });

  it("各集問題不是同一句模板（至少大部分互不相同）", () => {
    const questions = listEpisodeFaqSlugs().map(
      (slug) => getEpisodeFaq(slug)!.question,
    );
    const unique = new Set(questions);

    expect(unique.size).toBe(questions.length);
  });

  it("enrichStory 合併到 Story.episodeFaq，且與 sidecar 一致", () => {
    for (const slug of listEpisodeFaqSlugs()) {
      const story = getStory(slug);
      expect(story?.episodeFaq, slug).toEqual(getEpisodeFaq(slug));
    }
  });

  it("與同一集的 familyActivity／reflectionPrompt／parentGuide 文案不逐字重複", () => {
    for (const slug of listEpisodeFaqSlugs()) {
      const faq = getEpisodeFaq(slug)!;
      const activity = getFamilyActivity(slug);
      const reflection = getReflectionPrompt(slug);
      const guide = getParentGuide(slug);

      const otherTexts = [
        activity?.question,
        activity?.activity,
        reflection?.child,
        reflection?.parentFollowUp,
        guide?.summary,
        ...(guide?.prompts ?? []),
      ].filter((text): text is string => Boolean(text?.trim()));

      for (const other of otherTexts) {
        expect(hasDuplicateGuideText(faq.question, other), slug).toBe(false);
        expect(hasDuplicateGuideText(faq.answer, other), slug).toBe(false);
      }
    }
  });

  it("storyFaqs() 併入 episodeFaq 後，單集內題目不重複", () => {
    for (const story of getStories()) {
      if (!story.episodeFaq) continue;
      const faqs = storyFaqs(story);
      const questions = faqs.map((faq) => faq.question);
      expect(new Set(questions).size, story.slug).toBe(questions.length);
    }
  });

  describe("episodeFaqCoverage", () => {
    it("計算覆蓋率與缺漏 slug 清單", () => {
      const coverage = episodeFaqCoverage(["ep-1", "ep-2", "ep-not-exist"]);

      expect(coverage.total).toBe(3);
      expect(coverage.covered).toBe(2);
      expect(coverage.ratio).toBeCloseTo(2 / 3);
      expect(coverage.missingSlugs).toEqual(["ep-not-exist"]);
    });

    it("對照目前 getStories() 全集數的覆蓋率", () => {
      const allSlugs = getStories().map((s) => s.slug);
      const coverage = episodeFaqCoverage(allSlugs);

      expect(coverage.total).toBe(allSlugs.length);
      expect(coverage.covered).toBeGreaterThan(0);
      expect(coverage.covered + coverage.missingSlugs.length).toBe(
        coverage.total,
      );
    });
  });
});
