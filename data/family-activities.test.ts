import { describe, expect, it } from "vitest";
import { getStories, getStory } from "./content";
import { getFamilyActivity } from "./family-activities";

describe("family-activities", () => {
  it("示範集數有 question 且對得到實際集數", () => {
    for (const slug of ["ep-5", "ep-1"]) {
      const activity = getFamilyActivity(slug);
      expect(activity?.question.trim().length).toBeGreaterThan(0);
      expect(getStory(slug)).toBeDefined();
    }
  });

  it("未定義的 slug 回傳 undefined", () => {
    expect(getFamilyActivity("ep-not-exist")).toBeUndefined();
  });

  it("enrichStory 合併到 Story.familyActivity", () => {
    const withActivity = getStory("ep-5");
    expect(withActivity?.familyActivity?.question).toContain("挖土機");

    // 沒有 sidecar 資料的集數不得出現欄位值
    const others = getStories().filter(
      (s) => !["ep-5", "ep-1"].includes(s.slug),
    );
    expect(others.length).toBeGreaterThan(0);
    for (const story of others) {
      expect(story.familyActivity).toBeUndefined();
    }
  });
});
