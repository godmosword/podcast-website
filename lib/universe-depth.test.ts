import { describe, expect, it } from "vitest";
import { MAP_STAGE } from "@/data/universe-zones";
import { mapDepthZ } from "./universe-depth";

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
