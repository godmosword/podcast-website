import { describe, expect, it } from "vitest";
import { EPISODE_TINTS, episodeColorForSlug } from "./episode-colors";
import { getStories } from "./content";

describe("episode-colors", () => {
  it("六色粉彩從 ep-1 起輪替", () => {
    expect(EPISODE_TINTS).toHaveLength(6);
    expect(new Set(EPISODE_TINTS).size).toBe(6);
    expect(episodeColorForSlug("ep-1")).toBe("#f7a8c4");
    expect(episodeColorForSlug("ep-2")).toBe("#ffd866");
    expect(episodeColorForSlug("ep-3")).toBe("#b7df9b");
    expect(episodeColorForSlug("ep-4")).toBe("#8fcde8");
    expect(episodeColorForSlug("ep-5")).toBe("#79c8c1");
    expect(episodeColorForSlug("ep-6")).toBe("#c5b3e6");
    expect(episodeColorForSlug("ep-7")).toBe(episodeColorForSlug("ep-1"));
    expect(episodeColorForSlug("ep-13")).toBe("#f7a8c4");
    expect(episodeColorForSlug("not-an-episode")).toBe(EPISODE_TINTS[0]);
  });

  it("站上故事只用這六色當墊色", () => {
    const allowed = new Set<string>(EPISODE_TINTS);
    for (const story of getStories()) {
      expect(story.color).toBe(episodeColorForSlug(story.slug));
      expect(allowed.has(story.color)).toBe(true);
    }
  });
});
