import { describe, expect, it } from "vitest";
import { getStories } from "./content";
import { getReflectionPrompt } from "./reflection-prompts";

describe("reflection-prompts", () => {
  it("全部集數都有反思提問（STEM-P1 回填完成）", () => {
    for (const story of getStories()) {
      const prompt = story.reflectionPrompt ?? getReflectionPrompt(story.slug);
      expect(prompt, `${story.slug} 缺 reflectionPrompt`).toBeDefined();
    }
  });

  it("child 為開放問句（問號結尾）、parentFollowUp 非空", () => {
    for (const story of getStories()) {
      const prompt = getReflectionPrompt(story.slug);
      if (!prompt) continue;
      expect(prompt.child.trim(), `${story.slug} child 應以問號結尾`).toMatch(
        /[？?]$/,
      );
      expect(
        prompt.parentFollowUp.trim().length,
        `${story.slug} parentFollowUp 不可為空`,
      ).toBeGreaterThan(0);
    }
  });

  it("未知 slug 回傳 undefined", () => {
    expect(getReflectionPrompt("ep-not-exist")).toBeUndefined();
  });
});
