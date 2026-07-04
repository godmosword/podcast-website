import { describe, expect, it } from "vitest";
import { getStory, getStories } from "./content";
import { getStoryZoneId } from "./story-zones";

describe("story-zones", () => {
  it("示範集數對應有效 zone", () => {
    expect(getStoryZoneId("ep-1")).toBe("car-park");
    expect(getStoryZoneId("ep-3")).toBe("car-park");
    expect(getStoryZoneId("ep-6")).toBe("rescue");
    for (const slug of ["ep-1", "ep-3", "ep-6"]) {
      expect(getStory(slug)).toBeDefined();
    }
  });

  it("未定義 slug 回傳 undefined", () => {
    expect(getStoryZoneId("ep-not-exist")).toBeUndefined();
  });

  it("enrichStory 合併到 Story.zoneId", () => {
    expect(getStory("ep-1")?.zoneId).toBe("car-park");
    expect(getStory("ep-6")?.zoneId).toBe("rescue");

    const others = getStories().filter(
      (s) => !["ep-1", "ep-3", "ep-6"].includes(s.slug),
    );
    for (const story of others) {
      expect(story.zoneId).toBeUndefined();
    }
  });
});
