import { describe, expect, it } from "vitest";
import {
  TAIWAN_MAP_BOUNDS,
  TAIWAN_MAP_CENTER,
  TAIWAN_MAX_BOUNDS,
  TAIWAN_NATIONAL_MAX_ZOOM,
  TAIWAN_NATIONAL_TARGET_WEST,
  TAIWAN_SOFT_MIN_ZOOM,
  isTaiwanFocusedWest,
  taiwanMapBoundsCorners,
  taiwanNationalView,
  taiwanNationalWestEdge,
} from "./play-map-camera";

describe("play-map Taiwan camera", () => {
  it("全國框包住台灣本島，西緣不把福建當主體", () => {
    expect(TAIWAN_MAP_BOUNDS.west).toBeGreaterThan(119.8);
    expect(TAIWAN_MAP_BOUNDS.east).toBeLessThan(122.2);
    expect(TAIWAN_MAP_BOUNDS.south).toBeLessThan(22.2);
    expect(TAIWAN_MAP_BOUNDS.north).toBeGreaterThan(25.2);
    expect(isTaiwanFocusedWest(TAIWAN_MAP_BOUNDS.west)).toBe(true);
    expect(isTaiwanFocusedWest(117.5)).toBe(false);
  });

  it("軟 maxBounds 比全國框寬一點，仍遠小於華東全幅", () => {
    expect(TAIWAN_MAX_BOUNDS.west).toBeLessThan(TAIWAN_MAP_BOUNDS.west);
    expect(TAIWAN_MAX_BOUNDS.west).toBeGreaterThan(119.7);
    expect(TAIWAN_MAX_BOUNDS.east).toBeGreaterThan(TAIWAN_MAP_BOUNDS.east);
    expect(TAIWAN_MAX_BOUNDS.east).toBeLessThan(123);
    expect(TAIWAN_SOFT_MIN_ZOOM).toBeGreaterThanOrEqual(7);
    expect(TAIWAN_NATIONAL_MAX_ZOOM).toBeGreaterThanOrEqual(
      TAIWAN_SOFT_MIN_ZOOM,
    );
  });

  it("中心落在台灣，角落格式可供 Leaflet maxBounds", () => {
    const [sw, ne] = taiwanMapBoundsCorners();
    expect(TAIWAN_MAP_CENTER[0]).toBeGreaterThan(sw[0]);
    expect(TAIWAN_MAP_CENTER[0]).toBeLessThan(ne[0]);
    expect(TAIWAN_MAP_CENTER[1]).toBeGreaterThan(sw[1]);
    expect(TAIWAN_MAP_CENTER[1]).toBeLessThan(ne[1]);
  });

  it("全國鏡頭依地圖寬度東移，西緣釘在海峽而不是福建城市", () => {
    const phone = taiwanNationalView(390);
    const desktop = taiwanNationalView(720);
    expect(phone.zoom).toBe(TAIWAN_NATIONAL_MAX_ZOOM);
    expect(desktop.zoom).toBe(TAIWAN_NATIONAL_MAX_ZOOM);
    expect(desktop.center[1]).toBeGreaterThan(phone.center[1]);
    expect(taiwanNationalWestEdge(390)).toBeCloseTo(
      TAIWAN_NATIONAL_TARGET_WEST,
      5,
    );
    expect(taiwanNationalWestEdge(720)).toBeCloseTo(
      TAIWAN_NATIONAL_TARGET_WEST,
      5,
    );
    expect(taiwanNationalWestEdge(720)).toBeGreaterThan(119.95);
  });
});
