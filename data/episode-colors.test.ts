import { describe, expect, it } from "vitest";
import { EPISODE_COLORS, episodeColorForSlug } from "./episode-colors";
import { getStories } from "./content";

describe("episode-colors", () => {
  it("ep-1 至 ep-11 各有唯一配色", () => {
    const colors = Object.values(EPISODE_COLORS);
    expect(colors.length).toBe(11);
    expect(new Set(colors).size).toBe(11);
  });

  it("站上故事使用集中配色表", () => {
    for (const story of getStories()) {
      expect(story.color).toBe(episodeColorForSlug(story.slug));
    }
  });
});
