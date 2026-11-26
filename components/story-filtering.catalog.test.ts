import { describe, expect, it } from "vitest";
import { storiesByNewest } from "@/data/content";
import { STORY_FINDER_THEMES, episodeFinderTheme } from "@/data/episode-themes";
import { filterStories } from "./story-filtering";

describe("filterStories 目錄計數", () => {
  const stories = storiesByNewest();

  it("未篩選時包含最新一集，則數等於目錄", () => {
    const filtered = filterStories(stories, { vehicle: null, tag: null });
    expect(filtered.map((story) => story.slug)).toEqual(
      stories.map((story) => story.slug),
    );
  });

  it("每個主題的則數等於該主題的集數", () => {
    for (const tag of STORY_FINDER_THEMES) {
      const expected = stories
        .filter((story) => episodeFinderTheme(story.slug) === tag)
        .map((story) => story.slug);
      const filtered = filterStories(stories, { vehicle: null, tag }).map(
        (story) => story.slug,
      );
      expect(filtered, tag).toEqual(expected);
      expect(expected.length).toBeGreaterThan(0);
    }
  });
});
