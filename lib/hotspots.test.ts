import { describe, expect, it } from "vitest";
import {
  getHotspotsForPage,
  getHotspotsForStory,
  listHotspotSlugs,
} from "./hotspots";

describe("hotspots", () => {
  it("lists configured slugs", () => {
    expect(listHotspotSlugs()).toEqual(expect.arrayContaining(["ep-8", "ep-9"]));
  });

  it("returns hotspots for ep-9", () => {
    const hotspots = getHotspotsForStory("ep-9");
    expect(hotspots.length).toBeGreaterThanOrEqual(2);
    expect(hotspots.every((h) => h.tip.length > 0)).toBe(true);
  });

  it("filters by zero-based page index", () => {
    const page0 = getHotspotsForPage("ep-8", 0);
    expect(page0.length).toBeGreaterThan(0);
    expect(page0.every((h) => h.page === 1)).toBe(true);
  });

  it("returns empty for unknown slug", () => {
    expect(getHotspotsForStory("ambulance")).toEqual([]);
  });
});
