import { describe, expect, it } from "vitest";
import { MAP_ROAMERS, ROAMER_ROUTES } from "./universe-roamers";

describe("universe-roamers", () => {
  it("MAP_ROAMERS id 唯一", () => {
    const ids = MAP_ROAMERS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("routeId 皆存在於 ROAMER_ROUTES", () => {
    const routeIds = new Set(ROAMER_ROUTES.map((r) => r.id));
    for (const roamer of MAP_ROAMERS) {
      expect(routeIds.has(roamer.routeId), `${roamer.id} routeId`).toBe(true);
    }
  });

  it("route.d 以 M 開頭", () => {
    for (const route of ROAMER_ROUTES) {
      expect(route.d.trim().startsWith("M")).toBe(true);
    }
  });

  it("speed > 0", () => {
    for (const roamer of MAP_ROAMERS) {
      expect(roamer.speed).toBeGreaterThan(0);
    }
  });

  it("startOffset 落在 0..1", () => {
    for (const roamer of MAP_ROAMERS) {
      if (roamer.startOffset !== undefined) {
        expect(roamer.startOffset).toBeGreaterThanOrEqual(0);
        expect(roamer.startOffset).toBeLessThanOrEqual(1);
      }
    }
  });
});
