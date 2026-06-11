import { describe, expect, it } from "vitest";
import { getStory } from "../../data/content";
import {
  REFERENCE_ILLUSTRATED_SLUGS,
  verifyIllustratedEpisode,
  verifyStoryWorkflow,
} from "./episode-workflow";

describe("REFERENCE_ILLUSTRATED_SLUGS", () => {
  it("範本為 ep-9 與 ep-10", () => {
    expect(REFERENCE_ILLUSTRATED_SLUGS).toEqual(["ep-9", "ep-10"]);
  });
});

describe("ep-9 / ep-10 黃金範本", () => {
  for (const slug of REFERENCE_ILLUSTRATED_SLUGS) {
    it(`${slug} 符合全幕插圖標準`, () => {
      const story = getStory(slug);
      expect(story).toBeDefined();
      const errors = verifyIllustratedEpisode(story!).filter(
        (i) => i.level === "error",
      );
      expect(errors).toEqual([]);
    });
  }
});

describe("ep-1 已升級為全幕標準", () => {
  it("ep-1 通過 illustrated 驗證", () => {
    const story = getStory("ep-1");
    expect(story?.pageCount).toBeGreaterThan(1);
    const errors = verifyIllustratedEpisode(story!).filter(
      (i) => i.level === "error",
    );
    expect(errors).toEqual([]);
  });
});

describe("MVP 與 legacy", () => {
  it("ep-7 為 MVP（pageCount=1、無全幕 error）", () => {
    const story = getStory("ep-7");
    expect(story?.pageCount).toBe(1);
    const issues = verifyStoryWorkflow(story!);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });

  it("ep-2 為 legacy 6 頁 placeholder（警告、待重做 illustrate）", () => {
    const story = getStory("ep-2");
    expect(story?.pageCount).toBe(6);
    const issues = verifyStoryWorkflow(story!);
    expect(issues.some((i) => i.code === "legacy-placeholder")).toBe(true);
    expect(issues.filter((i) => i.level === "error")).toEqual([]);
  });
});
