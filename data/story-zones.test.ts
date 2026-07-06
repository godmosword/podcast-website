import { describe, expect, it } from "vitest";
import { getStory, getStories } from "./content";
import { getStoryZoneId } from "./story-zones";
import { ZONE_IDS } from "./universe-zones";

describe("story-zones", () => {
  it("示範集數對應有效 zone", () => {
    expect(getStoryZoneId("ep-1")).toBe("car-park");
    expect(getStoryZoneId("ep-6")).toBe("rescue");
    expect(getStoryZoneId("ep-9")).toBe("dino");
    expect(getStoryZoneId("ep-16")).toBe("ocean");
  });

  it("未定義 slug 回傳 undefined", () => {
    expect(getStoryZoneId("ep-not-exist")).toBeUndefined();
  });

  it("back catalog 全數對映到有效 zone", () => {
    for (const story of getStories()) {
      const zoneId = getStoryZoneId(story.slug);
      expect(zoneId, `${story.slug} 缺 zone 對映`).toBeDefined();
      expect(ZONE_IDS).toContain(zoneId);
    }
  });

  it("enrichStory 合併到 Story.zoneId", () => {
    expect(getStory("ep-1")?.zoneId).toBe("car-park");
    expect(getStory("ep-6")?.zoneId).toBe("rescue");
    expect(getStory("ep-13")?.zoneId).toBe("dino");
  });
});
