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
});
