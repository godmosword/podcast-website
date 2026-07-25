import { describe, expect, it } from "vitest";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  ZONE_OCCLUDERS,
  getRoutePathD,
  resolveRoamerSprites,
  roamerHasRear,
  roamerGreeting,
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

  it("已移除海上繞圈漫遊車（無 sea-orbit roamer／路線）", () => {
    expect(MAP_ROAMERS.some((r) => r.routeId === "map-sea-orbit")).toBe(false);
    expect(ROAMER_ROUTES.some((r) => r.id === "map-sea-orbit")).toBe(false);
    expect(
      MAP_ROAMERS.some(
        (r) => r.id === "roam-xiaohong" || r.id === "roam-duoduo",
      ),
    ).toBe(false);
  });

  it("每條 route path 以 M 開頭", () => {
    for (const route of ROAMER_ROUTES) {
      expect(getRoutePathD(route).trim().startsWith("M")).toBe(true);
    }
  });

  it("map 路線保留開放橋（供 dev 橋線視覺化）", () => {
    const mapRoutes = ROAMER_ROUTES.filter((r) => r.kind === "map");
    expect(mapRoutes.some((r) => r.id.startsWith("map-bridge-"))).toBe(true);
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

describe("roamerGreeting", () => {
  it("用角色正式名稱產生問候", () => {
    expect(roamerGreeting("xiao-hong")).toBe("嗨！我是小紅賽車！");
  });

  it("查無角色時回退短問候", () => {
    expect(roamerGreeting("not-real")).toBe("嗨！");
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

  it("恐龍島車（阿酷／怪獸卡車）已有 rear 視圖", () => {
    expect(roamerHasRear(MAP_ROAMERS.find((r) => r.id === "roam-aku")!)).toBe(true);
    expect(roamerHasRear(MAP_ROAMERS.find((r) => r.id === "roam-monster")!)).toBe(
      true,
    );
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
    const route = ROAMER_ROUTES.find(
      (r) => r.kind === "island" && r.zoneId === "car-park",
    );
    expect(route?.kind).toBe("island");
    if (route?.kind !== "island") return;
    expect(route.tilePath.trim().endsWith("Z")).toBe(true);
    expect(route.pingpong).toBeFalsy();
  });
});
