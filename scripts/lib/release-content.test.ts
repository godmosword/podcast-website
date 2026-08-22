import { describe, expect, it } from "vitest";
import { getStory } from "../../data/content";
import { classifyReleaseIssues } from "./release-content";

describe("classifyReleaseIssues", () => {
  it("接受 pageCount=1 的 illustrate-pending，但不接受未校對字幕", () => {
    const story = getStory("ep-26");
    if (!story) throw new Error("ep-26 不在目錄中");

    const result = classifyReleaseIssues([story], [
      {
        slug: story.slug,
        level: "warn",
        code: "illustrate-pending",
        message: "待生圖",
      },
      {
        slug: story.slug,
        level: "warn",
        code: "subtitle-unproofread",
        message: "待校對",
      },
    ]);

    expect(result.acceptedWarnings).toHaveLength(1);
    expect(result.acceptedWarnings[0]?.code).toBe("illustrate-pending");
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0]?.code).toBe("subtitle-unproofread");
  });

  it("所有 error 與未知 warning 都是 release blocker", () => {
    const story = getStory("ep-26");
    if (!story) throw new Error("ep-26 不在目錄中");

    const result = classifyReleaseIssues([story], [
      { slug: story.slug, level: "error", code: "missing-cover", message: "缺圖" },
      { slug: story.slug, level: "warn", code: "legacy-placeholder", message: "舊集" },
    ]);

    expect(result.blockers.map((issue) => issue.code)).toEqual([
      "missing-cover",
      "legacy-placeholder",
    ]);
    expect(result.acceptedWarnings).toEqual([]);
  });
});
