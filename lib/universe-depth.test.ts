import { describe, expect, it } from "vitest";
import { MAP_STAGE } from "@/data/universe-zones";
import { islandHaze, mapDepthZ } from "./universe-depth";

describe("mapDepthZ", () => {
  it("orders deeper stage y values in front within the same band", () => {
    expect(mapDepthZ(420, "island")).toBeGreaterThan(mapDepthZ(280, "island"));
  });

  it("keeps same-y bridges behind islands and roamers", () => {
    const y = 360;
    expect(mapDepthZ(y, "bridge")).toBeLessThan(mapDepthZ(y, "island"));
    expect(mapDepthZ(y, "island")).toBeLessThan(mapDepthZ(y, "roamer"));
  });

  it("keeps labels above all physical map content", () => {
    expect(mapDepthZ(0, "label")).toBeGreaterThan(
      mapDepthZ(MAP_STAGE.height, "roamer"),
    );
  });

  it("floats hotspots above every label, and bubbles above every hotspot", () => {
    // 互動探索點不該被裝飾木牌壓住；短暫對話泡泡連探索點都不遮它。
    expect(mapDepthZ(0, "hotspot")).toBeGreaterThan(
      mapDepthZ(MAP_STAGE.height, "label"),
    );
    expect(mapDepthZ(0, "bubble")).toBeGreaterThan(
      mapDepthZ(MAP_STAGE.height, "hotspot"),
    );
  });

  it("orders deeper stage y in front within the floating bands too", () => {
    expect(mapDepthZ(420, "hotspot")).toBeGreaterThan(mapDepthZ(280, "hotspot"));
    expect(mapDepthZ(420, "bubble")).toBeGreaterThan(mapDepthZ(280, "bubble"));
  });
});

describe("islandHaze", () => {
  it("hazes far (small y) islands more than near (large y) ones", () => {
    // 3/4 diorama：y 越小＝越遠，大氣透視應該讓遠島退後。
    expect(islandHaze(175)).toBeGreaterThan(islandHaze(560));
  });

  it("stays within 0..1 across and beyond the stage", () => {
    for (const y of [-50, 0, 175, 360, 560, MAP_STAGE.height, MAP_STAGE.height + 99]) {
      expect(islandHaze(y)).toBeGreaterThanOrEqual(0);
      expect(islandHaze(y)).toBeLessThanOrEqual(1);
    }
  });

  it("gives the very front of the stage no haze at all", () => {
    expect(islandHaze(MAP_STAGE.height)).toBe(0);
  });

  it("keeps the spread between the real islands subtle, not theatrical", () => {
    // 五島 y 落在 175..560；差距太大會讓遠島看起來髒掉，而不是退後。
    const spread = islandHaze(175) - islandHaze(560);
    expect(spread).toBeGreaterThan(0.3);
    expect(spread).toBeLessThan(0.7);
  });

  it("is monotonic so islands never swap apparent distance", () => {
    const ys = [100, 200, 300, 400, 500, 600];
    const hazes = ys.map(islandHaze);
    for (let i = 1; i < hazes.length; i += 1) {
      expect(hazes[i]).toBeLessThanOrEqual(hazes[i - 1]);
    }
  });
});
