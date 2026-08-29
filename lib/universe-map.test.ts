import { describe, expect, it } from "vitest";
import { LANDING_SEGMENTS } from "@/data/landing-segments";
import { MAP_STAGE } from "@/data/universe-zones";
import { getCarParkLinks, resolveUniverseMap } from "./universe-map";

describe("resolveUniverseMap", () => {
  const map = resolveUniverseMap();

  it("中樞 4 輻＋外環 3＝7 條 bridge", () => {
    expect(map.bridges.length).toBe(7);
    const ids = new Set(map.bridges.map((b) => b.id));
    expect(ids).toEqual(
      new Set([
        "car-park-dino",
        "car-park-forest",
        "car-park-rescue",
        "car-park-ocean",
        "dino-forest",
        "forest-rescue",
        "rescue-ocean",
      ]),
    );
  });

  it("不畫對角穿越（dino–ocean、dino–rescue、forest–ocean）", () => {
    const pairs = new Set(map.bridges.map((b) => `${b.from}-${b.to}`));
    expect(pairs.has("dino-ocean")).toBe(false);
    expect(pairs.has("ocean-dino")).toBe(false);
    expect(pairs.has("dino-rescue")).toBe(false);
    expect(pairs.has("rescue-dino")).toBe(false);
    expect(pairs.has("forest-ocean")).toBe(false);
    expect(pairs.has("ocean-forest")).toBe(false);
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
    const carParkDino = map.bridges.find((b) => b.id === "car-park-dino")!;
    const carParkForest = map.bridges.find((b) => b.id === "car-park-forest")!;
    const carParkRescue = map.bridges.find((b) => b.id === "car-park-rescue")!;
    const rescueOcean = map.bridges.find((b) => b.id === "rescue-ocean")!;
    expect(carParkDino.dashed).toBe(false);
    expect(carParkForest.dashed).toBe(false);
    expect(carParkRescue.dashed).toBe(true);
    expect(rescueOcean.dashed).toBe(true);
  });

  it("森林小島偏東北，錯開車車樂園正上方", () => {
    const forest = map.zones.find((z) => z.id === "forest")!;
    const carPark = map.zones.find((z) => z.id === "car-park")!;
    expect(forest.px).toEqual({ x: 580, y: 175 });
    expect(forest.px.x).toBeGreaterThan(carPark.px.x);
    expect(forest.px.y).toBeLessThan(200);
  });
});

describe("getCarParkLinks", () => {
  it("短標用 navLabel；href／external 仍對 CTA", () => {
    const links = getCarParkLinks();
    expect(links.length).toBe(LANDING_SEGMENTS.length);
    links.forEach((link, i) => {
      const seg = LANDING_SEGMENTS[i]!;
      const cta = seg.cta;
      expect(link.href).toBe(cta.href);
      expect(link.label).toBe(seg.navLabel);
      expect(link.label).not.toBe(cta.label);
      expect(link.external).toBe(cta.external);
    });
  });
});
