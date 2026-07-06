import { describe, expect, it } from "vitest";
import { getStory } from "@/data/content";
import { buildZoneStoryPreviewsMap, getStoriesByZone } from "./story-zone-query";

describe("story-zone-query", () => {
  it("getStoriesByZone 回傳對應 zone 的集數", () => {
    const carPark = getStoriesByZone("car-park");
    expect(carPark.length).toBeGreaterThanOrEqual(2);
    expect(carPark.every((s) => s.zoneId === "car-park")).toBe(true);
    expect(carPark.some((s) => s.slug === "ep-1")).toBe(true);
    expect(carPark.some((s) => s.slug === "ep-3")).toBe(true);

    const rescue = getStoriesByZone("rescue");
    expect(rescue.every((s) => s.zoneId === "rescue")).toBe(true);
    expect(rescue.some((s) => s.slug === "ep-6")).toBe(true);
  });

  it("buildZoneStoryPreviewsMap 每 zone 最多 3 筆預覽", () => {
    const map = buildZoneStoryPreviewsMap();
    for (const bundle of Object.values(map)) {
      expect(bundle.previews.length).toBeLessThanOrEqual(3);
      expect(bundle.total).toBeGreaterThanOrEqual(bundle.previews.length);
    }
    expect(map["car-park"].total).toBe(getStoriesByZone("car-park").length);
  });

  it("示範集數 zoneId 可反查", () => {
    expect(getStory("ep-6")?.zoneId).toBe("rescue");
    expect(
      getStoriesByZone("rescue").some((s) => s.title.includes("救護車")),
    ).toBe(true);
  });
});
