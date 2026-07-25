import { describe, expect, it } from "vitest";
import { universeSchema } from "./universe";
import {
  ISLAND_FOCUS_ZOOM,
  MAP_STAGE,
  STATUS_META,
  ZONE_IDS,
  statusCounts,
  universe,
  worldToStage,
  zoneById,
} from "./universe";

describe("data/universe（M0 單一資料來源）", () => {
  it("zod parse 成功且五島齊全", () => {
    expect(universe.zones.map((z) => z.id).sort()).toEqual(
      [...ZONE_IDS].sort(),
    );
    expect(universe.zones).toHaveLength(5);
  });

  it("故意打錯 status 時 zod parse 失敗（build 期可抓）", () => {
    const bad = {
      camera: universe.camera,
      zones: universe.zones.map((z, i) =>
        i === 0 ? { ...z, status: "oppen" } : z,
      ),
    };
    expect(() => universeSchema.parse(bad)).toThrow();
  });

  it("world→stage 還原既有 px 快照", () => {
    const snapshot = Object.fromEntries(
      universe.zones.map((zone) => [
        zone.id,
        { coord: worldToStage(zone.world), sprite: zone.sprite },
      ]),
    );
    expect(snapshot).toEqual({
      "car-park": {
        coord: { x: 410, y: 495 },
        sprite: "/adventures/zones/car-park.png",
      },
      dino: {
        coord: { x: 175, y: 300 },
        sprite: "/adventures/zones/dino.png",
      },
      rescue: {
        coord: { x: 785, y: 300 },
        sprite: "/adventures/zones/rescue.png",
      },
      ocean: {
        coord: { x: 825, y: 560 },
        sprite: "/adventures/zones/ocean.png",
      },
      forest: {
        coord: { x: 500, y: 215 },
        sprite: "/adventures/zones/forest.png",
      },
    });
  });

  it("每島 camera.center 對齊 world；zoom 為進島預設", () => {
    for (const zone of universe.zones) {
      expect(zone.camera.center).toEqual([zone.world.x, zone.world.y]);
      expect(zone.camera.zoom).toBe(ISLAND_FOCUS_ZOOM);
      expect(zone.world.x).toBeGreaterThanOrEqual(0);
      expect(zone.world.x).toBeLessThanOrEqual(1);
      expect(zone.world.y).toBeGreaterThanOrEqual(0);
      expect(zone.world.y).toBeLessThanOrEqual(1);
    }
  });

  it("statusCounts 反映現況（1 open / 2 building / 1 coming / 1 planned）", () => {
    expect(statusCounts()).toEqual({
      open: 1,
      building: 2,
      coming: 1,
      planned: 1,
    });
  });

  it("statusCounts 可接受子集（供 HUD 測試過濾）", () => {
    const subset = universe.zones.filter((z) => z.status !== "planned");
    expect(statusCounts(subset).planned).toBe(0);
    expect(statusCounts(subset).open).toBe(1);
  });

  it("zoneById 查得到／查不到", () => {
    expect(zoneById("dino")?.name).toBe("恐龍島");
    expect(zoneById("nope")).toBeUndefined();
  });

  it("STATUS_META 涵蓋四態且有 icon", () => {
    expect(Object.keys(STATUS_META).sort()).toEqual([
      "building",
      "coming",
      "open",
      "planned",
    ]);
    for (const meta of Object.values(STATUS_META)) {
      expect(meta.icon).toBeTruthy();
      expect(meta.label).toBeTruthy();
    }
  });

  it("camera min/max 對齊既有鏡頭夾限語意", () => {
    expect(universe.camera.minZoom).toBe(0.34);
    expect(universe.camera.maxZoom).toBe(2.0);
    expect(MAP_STAGE).toEqual({ width: 1000, height: 720 });
  });

  it("M3：五島皆有熱點；恐龍島優先最完整", () => {
    const counts = Object.fromEntries(
      universe.zones.map((z) => [z.id, z.hotspots.length]),
    );
    expect(counts["car-park"]).toBeGreaterThanOrEqual(5);
    expect(counts.dino).toBeGreaterThanOrEqual(8);
    expect(counts.rescue).toBeGreaterThanOrEqual(4);
    expect(counts.ocean).toBeGreaterThanOrEqual(4);
    expect(counts.forest).toBeGreaterThanOrEqual(3);

    const dino = universe.zones.find((z) => z.id === "dino")!;
    expect(dino.hotspots.some((h) => h.id === "joke-plaza")).toBe(true);
    expect(dino.hotspots.some((h) => h.action.type === "story")).toBe(true);
    expect(dino.hotspots.some((h) => h.action.type === "locked")).toBe(true);
  });
});
