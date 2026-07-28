import { describe, expect, it } from "vitest";
import { LANDING_SEGMENTS } from "@/data/landing-segments";
import { MAP_STAGE, ZONES } from "@/data/universe-zones";
import { getCarParkLinks, resolveUniverseMap } from "./universe-map";

describe("resolveUniverseMap", () => {
  const map = resolveUniverseMap();

  it("五島完全圖：每對島各一條 bridge（C(5,2)=10）", () => {
    const n = ZONES.length;
    expect(map.bridges.length).toBe((n * (n - 1)) / 2);
    expect(map.bridges.length).toBe(10);
    const ids = new Set(map.bridges.map((b) => b.id));
    expect(ids.size).toBe(10);
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
    // car-park 為 weenie hero box（264×260 × 1.25 = 330×325）；
    // 錨點 sand-bottom-center [0.5,0.84]：left=410-165=245、top=495-0.84*325=222
    expect(carPark.tileBox).toEqual({ left: 245, top: 222, w: 330, h: 325 });
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

  it("dashed＝連到 coming/planned 時略淡；open↔building 仍為實心黏土", () => {
    const carParkDino = map.bridges.find(
      (b) =>
        (b.from === "car-park" && b.to === "dino") ||
        (b.from === "dino" && b.to === "car-park"),
    )!;
    const carParkForest = map.bridges.find(
      (b) =>
        (b.from === "car-park" && b.to === "forest") ||
        (b.from === "forest" && b.to === "car-park"),
    )!;
    const dinoRescue = map.bridges.find(
      (b) =>
        (b.from === "dino" && b.to === "rescue") ||
        (b.from === "rescue" && b.to === "dino"),
    )!;
    const oceanAny = map.bridges.find(
      (b) => b.from === "ocean" || b.to === "ocean",
    )!;
    expect(carParkDino.dashed).toBe(false);
    expect(carParkForest.dashed).toBe(false);
    expect(dinoRescue.dashed).toBe(true);
    expect(oceanAny.dashed).toBe(true);
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
