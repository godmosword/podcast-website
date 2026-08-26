import { describe, expect, it } from "vitest";
import { getStories } from "@/data/content";
import { illustrationStatusForPageCount } from "@/data/illustration-queue";
import { pendingIllustrationsForStudio } from "./illustration-queue-query";

describe("pendingIllustrationsForStudio", () => {
  it("列出 catalog 中 pageCount≤1 的 ep-N，且即時反映校對標記", () => {
    const pending = pendingIllustrationsForStudio();
    const expected = getStories()
      .filter(
        (story) =>
          /^ep-\d+$/.test(story.slug) &&
          illustrationStatusForPageCount(story.pageCount) ===
            "awaiting-illustrate",
      )
      .map((story) => story.slug)
      .sort();

    expect(pending.map((item) => item.slug).sort()).toEqual(expected);
    expect(pending.some((item) => item.slug === "ep-26")).toBe(true);
    const ep25 = pending.find((item) => item.slug === "ep-25");
    expect(ep25?.subtitleReady).toBe(true);
    expect(ep25?.title).toContain("雪山隧道");
    const ep26 = pending.find((item) => item.slug === "ep-26");
    expect(ep26?.subtitleReady).toBe(false);
    expect(ep26?.title).toContain("零食派對");
  });
});
