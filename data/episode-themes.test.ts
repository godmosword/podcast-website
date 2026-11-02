import { describe, expect, it } from "vitest";
import { getStories } from "./content";
import { storyDisplayTitle } from "@/lib/story-title";
import {
  EPISODE_THEMES,
  STORY_FINDER_THEMES,
  episodeFinderTheme,
  isStoryFinderTheme,
} from "./episode-themes";

describe("找故事主題", () => {
  it("下拉只有這七個，順序固定", () => {
    expect([...STORY_FINDER_THEMES]).toEqual([
      "成長勇氣",
      "責任品格",
      "生活好習慣",
      "情緒管理",
      "交友與合作助人",
      "安全與自我保護",
      "思考與創造",
    ]);
  });

  it("每一集都在對照表，而且剛好一個七主題之一", () => {
    const stories = getStories().slice().sort((a, b) => a.ep - b.ep);
    expect(EPISODE_THEMES.map((row) => row.slug)).toEqual(stories.map((story) => story.slug));
    for (const [index, row] of EPISODE_THEMES.entries()) {
      const story = stories[index];
      expect(row.ep).toBe(story?.ep);
      expect(row.title).toBe(story ? storyDisplayTitle(story) : "");
      expect(isStoryFinderTheme(row.theme)).toBe(true);
      expect(episodeFinderTheme(row.slug)).toBe(row.theme);
    }
    expect(isStoryFinderTheme("合作")).toBe(false);
    expect(episodeFinderTheme("missing")).toBe("");
  });
});
