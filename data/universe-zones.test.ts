import { describe, expect, it } from "vitest";
import { LANDING_SEGMENT_IDS } from "./landing-segments";
import {
  MAP_STAGE,
  ZONE_IDS,
  ZONE_STATUS_META,
  ZONE_TERRAIN,
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

  it("每種狀態都有學齡前語意 icon（純呈現欄位）", () => {
    for (const meta of Object.values(ZONE_STATUS_META)) {
      expect(meta.icon).toBeTruthy();
    }
  });

  it("未開放狀態有 tapBubble 文案", () => {
    expect(ZONE_STATUS_META.building.tapBubble).toBe("還在蓋喔！");
    expect(ZONE_STATUS_META.coming.tapBubble).toBe("快要開幕囉！");
    expect(ZONE_STATUS_META.planned.tapBubble).toBe("先逛逛吧！");
    expect(ZONE_STATUS_META.open.tapBubble).toBeUndefined();
  });

  it("未開放島嶼提供低壓探索文案", () => {
    for (const zone of ZONES.filter((z) => z.status !== "open")) {
      expect(zone.exploreNote, `${zone.id} 缺少 exploreNote`).toBeTruthy();
      expect(zone.exploreNote).not.toMatch(/投票|必須|完成任務/);
    }
  });

  it("ZONE_TERRAIN 涵蓋全部 ZoneId", () => {
    for (const id of ZONE_IDS) {
      expect(ZONE_TERRAIN[id]?.sand).toBeTruthy();
      expect(ZONE_TERRAIN[id]?.grass).toBeTruthy();
    }
  });

  it("每島皆有 artTile 靜態路徑（R1：整島黏土 PNG）", () => {
    for (const zone of ZONES) {
      expect(zone.artTile).toMatch(/^\/adventures\/zones\/[\w-]+\.png$/);
    }
  });

  it("id→coord→artTile 快照不變", () => {
    const snapshot = Object.fromEntries(
      ZONES.map((zone) => [
        zone.id,
        { coord: zone.coord, artTile: zone.artTile },
      ]),
    );
    expect(snapshot).toEqual({
      "car-park": {
        coord: { x: 500, y: 400 },
        artTile: "/adventures/zones/car-park.png",
      },
      dino: {
        coord: { x: 210, y: 260 },
        artTile: "/adventures/zones/dino.png",
      },
      rescue: {
        coord: { x: 820, y: 250 },
        artTile: "/adventures/zones/rescue.png",
      },
      ocean: {
        coord: { x: 820, y: 560 },
        artTile: "/adventures/zones/ocean.png",
      },
      forest: {
        coord: { x: 210, y: 560 },
        artTile: "/adventures/zones/forest.png",
      },
    });
  });

  it("未開放島有 childHint（≤10 字、≠ exploreNote 前綴）；open 島無 childHint", () => {
    for (const zone of ZONES) {
      if (zone.status === "open") {
        expect(zone.childHint, `${zone.id} 不應有 childHint`).toBeUndefined();
        continue;
      }
      expect(zone.childHint, `${zone.id} 缺少 childHint`).toBeTruthy();
      expect(Array.from(zone.childHint!).length).toBeLessThanOrEqual(10);
      expect(zone.exploreNote?.startsWith(zone.childHint!)).toBe(false);
    }
  });
});
