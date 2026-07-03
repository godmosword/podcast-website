import { describe, expect, it } from "vitest";
import { LANDING_SEGMENTS } from "@/data/landing-segments";
import { MAP_STAGE, ZONES } from "@/data/universe-zones";
import { getCarParkLinks, resolveUniverseMap } from "./universe-map";

describe("resolveUniverseMap", () => {
  const map = resolveUniverseMap();

  it("每個有 bridgeFrom 的 zone 都產出一條 bridge", () => {
    const expected = ZONES.filter((z) => z.bridgeFrom).length;
    expect(map.bridges.length).toBe(expected);
    expect(expected).toBe(4);
  });

  it("bridge.d 非空且以 M 開頭（合法 path 起始）", () => {
    for (const bridge of map.bridges) {
      expect(bridge.d.length).toBeGreaterThan(0);
      expect(bridge.d.startsWith("M")).toBe(true);
    }
  });

  it("viewBox 採 MAP_STAGE 尺寸且涵蓋全部島座標", () => {
    expect(map.viewBox).toBe(`0 0 ${MAP_STAGE.width} ${MAP_STAGE.height}`);
    for (const zone of map.zones) {
      expect(zone.px.x).toBeGreaterThanOrEqual(0);
      expect(zone.px.x).toBeLessThanOrEqual(MAP_STAGE.width);
      expect(zone.px.y).toBeGreaterThanOrEqual(0);
      expect(zone.px.y).toBeLessThanOrEqual(MAP_STAGE.height);
    }
  });

  it("每座島解析出 tileBox 與 depthY，供 2.5D 舞台排序", () => {
    const carPark = map.zones.find((z) => z.id === "car-park")!;
    // car-park 為 weenie hero box（264×260 × 1.25 = 330×325）
    expect(carPark.tileBox).toEqual({ left: 335, top: 127, w: 330, h: 325 });
    expect(carPark.depthY).toBe(carPark.px.y);
  });

  it("bridge 連到島緣 landing points，不再穿進島中心", () => {
    for (const bridge of map.bridges) {
      const from = map.zones.find((z) => z.id === bridge.from)!;
      const to = map.zones.find((z) => z.id === bridge.to)!;
      expect(bridge.fromPort).not.toEqual(from.px);
      expect(bridge.toPort).not.toEqual(to.px);
      expect(bridge.depthY).toBe(Math.max(bridge.fromPort.y, bridge.toPort.y));
      expect(bridge.d).toContain(`${bridge.fromPort.x}`);
      expect(bridge.d).toContain(`${bridge.toPort.x}`);
    }
  });

  it("dashed 旗標符合 coming/planned", () => {
    const dino = map.bridges.find((b) => b.to === "dino")!;
    const rescue = map.bridges.find((b) => b.to === "rescue")!;
    const ocean = map.bridges.find((b) => b.to === "ocean")!;
    const forest = map.bridges.find((b) => b.to === "forest")!;
    expect(dino.dashed).toBe(false); // building → 實心
    expect(forest.dashed).toBe(false); // building → 實心
    expect(rescue.dashed).toBe(true); // coming → 虛線
    expect(ocean.dashed).toBe(true); // planned → 虛線
  });
});

describe("getCarParkLinks", () => {
  it("連結與 LANDING_SEGMENTS CTA 完全一致", () => {
    const links = getCarParkLinks();
    expect(links.length).toBe(LANDING_SEGMENTS.length);
    links.forEach((link, i) => {
      const cta = LANDING_SEGMENTS[i]!.cta;
      expect(link.href).toBe(cta.href);
      expect(link.label).toBe(cta.label);
      expect(link.external).toBe(cta.external);
    });
  });
});
