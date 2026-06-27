import { describe, expect, it } from "vitest";
import { LANDING_SEGMENT_IDS } from "./landing-segments";
import {
  MAP_STAGE,
  ZONE_IDS,
  ZONE_STATUS_META,
  ZONES,
  type ZoneId,
} from "./universe-zones";

describe("universe-zones", () => {
  it("ZONE_IDS 唯一且與 ZONES 對應", () => {
    expect(new Set(ZONE_IDS).size).toBe(ZONE_IDS.length);
    expect(ZONES.length).toBe(ZONE_IDS.length);
    expect(ZONES.map((z) => z.id).sort()).toEqual([...ZONE_IDS].sort());
  });

  it("每島 coord 落在 MAP_STAGE 範圍內", () => {
    for (const zone of ZONES) {
      expect(zone.coord.x).toBeGreaterThanOrEqual(0);
      expect(zone.coord.x).toBeLessThanOrEqual(MAP_STAGE.width);
      expect(zone.coord.y).toBeGreaterThanOrEqual(0);
      expect(zone.coord.y).toBeLessThanOrEqual(MAP_STAGE.height);
    }
  });

  it("open 島可達（有 route 或 subSegmentIds）", () => {
    for (const zone of ZONES.filter((z) => z.status === "open")) {
      const reachable =
        Boolean(zone.route?.href) || (zone.subSegmentIds?.length ?? 0) > 0;
      expect(reachable, `open 島 ${zone.id} 無法導向`).toBe(true);
    }
  });

  it("building 島 buildProgress 介於 0–100", () => {
    for (const zone of ZONES.filter((z) => z.status === "building")) {
      expect(zone.buildProgress).toBeDefined();
      expect(zone.buildProgress!).toBeGreaterThanOrEqual(0);
      expect(zone.buildProgress!).toBeLessThanOrEqual(100);
    }
  });

  it("car-park.subSegmentIds 皆為合法 LandingSegmentId", () => {
    const carPark = ZONES.find((z) => z.id === "car-park")!;
    expect(carPark.subSegmentIds?.length).toBeGreaterThan(0);
    for (const id of carPark.subSegmentIds ?? []) {
      expect(LANDING_SEGMENT_IDS).toContain(id);
    }
  });

  it("所有 bridgeFrom 指向存在的 ZoneId", () => {
    const ids = new Set<ZoneId>(ZONE_IDS);
    for (const zone of ZONES) {
      if (zone.bridgeFrom) {
        expect(ids.has(zone.bridgeFrom), `${zone.id} bridgeFrom 不存在`).toBe(true);
      }
    }
  });

  it("ZONE_STATUS_META 涵蓋四種狀態", () => {
    expect(Object.keys(ZONE_STATUS_META).sort()).toEqual([
      "building",
      "coming",
      "open",
      "planned",
    ]);
  });
});
