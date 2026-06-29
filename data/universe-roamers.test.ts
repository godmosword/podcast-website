import { describe, expect, it } from "vitest";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  ZONE_OCCLUDERS,
  resolveRoamerSprites,
  roamerHasRear,
  roamerSpriteSrc,
  type Roamer,
} from "./universe-roamers";
import { ZONE_IDS } from "./universe-zones";

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

  it("每個 roamer 有 zoneId 且與 route 一致", () => {
    const routeById = new Map(ROAMER_ROUTES.map((r) => [r.id, r]));
    for (const roamer of MAP_ROAMERS) {
      expect(roamer.zoneId, roamer.id).toBeTruthy();
      const route = routeById.get(roamer.routeId);
      expect(route, roamer.routeId).toBeDefined();
      expect(roamer.zoneId).toBe(route!.zoneId);
    }
  });

  it("route.tilePath 以 M 開頭", () => {
    for (const route of ROAMER_ROUTES) {
      expect(route.tilePath.trim().startsWith("M")).toBe(true);
      expect(route.kind).toBe("island");
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

describe("roamer sprites（4 向）", () => {
  const base: Roamer = {
    id: "t",
    characterId: "c",
    zoneId: "car-park",
    routeId: "car-park-walkway",
    speed: 10,
    src: "/a/front.png",
    srcNight: "/a/front.night.png",
  };

  it("未設 sprites 時由 src 衍生 front，且無 rear", () => {
    expect(resolveRoamerSprites(base)).toEqual({
      front: "/a/front.png",
      frontNight: "/a/front.night.png",
    });
    expect(roamerHasRear(base)).toBe(false);
  });

  it("rear 未到位時回退 front", () => {
    expect(roamerSpriteSrc(base, "rear", false)).toBe("/a/front.png");
    expect(roamerSpriteSrc(base, "front", false)).toBe("/a/front.png");
  });

  it("night 旗標選夜間圖", () => {
    expect(roamerSpriteSrc(base, "front", true)).toBe("/a/front.night.png");
  });

  it("備有 rear 時 roamerHasRear 為真且各向各取其圖", () => {
    const r: Roamer = {
      ...base,
      sprites: { front: "/a/f.png", rear: "/a/r.png" },
    };
    expect(roamerHasRear(r)).toBe(true);
    expect(roamerSpriteSrc(r, "rear", false)).toBe("/a/r.png");
    expect(roamerSpriteSrc(r, "front", false)).toBe("/a/f.png");
  });

  it("MAP_ROAMERS 現役資產 rear 尚未到位（回退 front，不渲染破圖）", () => {
    for (const roamer of MAP_ROAMERS) {
      expect(roamerHasRear(roamer)).toBe(false);
    }
  });
});

describe("ZONE_OCCLUDERS", () => {
  it("key 皆為合法 ZoneId、clipPath/baseline 合理", () => {
    for (const [id, occ] of Object.entries(ZONE_OCCLUDERS)) {
      expect(ZONE_IDS).toContain(id);
      expect(occ.clipPath).toMatch(/^(ellipse|circle|polygon|inset)/);
      expect(occ.baselineY).toBeGreaterThan(0);
    }
  });

  it("car-park 步道為閉合迴圈（含 Z），後段繞過遮擋基線後方", () => {
    const route = ROAMER_ROUTES.find((r) => r.zoneId === "car-park")!;
    expect(route.tilePath.trim().endsWith("Z")).toBe(true);
    expect(route.pingpong).toBeFalsy();
  });
});
