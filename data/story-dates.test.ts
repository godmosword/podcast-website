import { describe, expect, it } from "vitest";
import { getStories } from "./content";
import {
  STORY_MODIFIED_DATE_SOURCE,
  storyDateModified,
  storyModifiedDates,
} from "./story-dates";

describe("storyModifiedDates", () => {
  it("現有每集都有可追溯的最後內容編輯時間", () => {
    const stories = getStories();

    for (const story of stories) {
      expect(storyModifiedDates[story.slug], story.slug).toBeDefined();
      expect(STORY_MODIFIED_DATE_SOURCE[story.slug], story.slug).toMatch(
        /^[0-9a-f]{7} /,
      );
    }
  });

  it("dateModified 不早於 datePublished", () => {
    for (const story of getStories()) {
      expect(
        new Date(storyDateModified(story)).getTime(),
        story.slug,
      ).toBeGreaterThanOrEqual(new Date(`${story.date}T00:00:00+08:00`).getTime());
    }
  });
});
