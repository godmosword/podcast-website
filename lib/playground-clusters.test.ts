import { describe, expect, it } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  CITY_AGGREGATE_MAX_ZOOM,
  INDIVIDUAL_MARKER_MIN_ZOOM,
  clusterPlaygroundsByCity,
  clusterPlaygroundsByZoom,
  isNationwideUnscoped,
  playMapMarkerMode,
} from "./playground-clusters";

const base = {
  district: "區",
  address: "x",
  type: "公園" as const,
  ageRange: [3, 8] as [number, number],
  indoor: false,
  free: true,
  facilities: [] as string[],
  tags: [] as string[],
  sources: [],
  lastVerified: "2026-01-01",
  tips: "",
};

describe("clusterPlaygroundsByCity", () => {
  it("空陣列回傳空", () => {
    expect(clusterPlaygroundsByCity([])).toEqual([]);
  });

  it("同縣取平均座標、跨縣分開", () => {
    const places = [
      {
        ...base,
        id: "a",
        name: "A",
        city: "台北市",
        lat: 25,
        lng: 121,
      },
      {
        ...base,
        id: "b",
        name: "B",
        city: "台北市",
        lat: 27,
        lng: 123,
      },
      {
        ...base,
        id: "c",
        name: "C",
        city: "台中市",
        lat: 24,
        lng: 120,
      },
    ] as Playground[];

    const clusters = clusterPlaygroundsByCity(places);
    expect(clusters).toHaveLength(2);
    const taipei = clusters.find((row) => row.city === "台北市");
    const taichung = clusters.find((row) => row.city === "台中市");
    expect(taipei).toEqual({
      city: "台北市",
      count: 2,
      lat: 26,
      lng: 122,
    });
    expect(taichung).toEqual({
      city: "台中市",
      count: 1,
      lat: 24,
      lng: 120,
    });
  });
});

describe("isNationwideUnscoped", () => {
  it("未選縣市且未定位才是全國未縮小", () => {
    expect(isNationwideUnscoped(null, false)).toBe(true);
    expect(isNationwideUnscoped("台北市", false)).toBe(false);
    expect(isNationwideUnscoped(null, true)).toBe(false);
  });
});

describe("zoom-aware marker modes", () => {
  it("保留全台低 zoom 的縣市 aggregate，並在區域／近景逐步拆解", () => {
    expect(
      playMapMarkerMode({ nationwideUnscoped: true, zoom: CITY_AGGREGATE_MAX_ZOOM }),
    ).toBe("city");
    expect(
      playMapMarkerMode({ nationwideUnscoped: true, zoom: CITY_AGGREGATE_MAX_ZOOM + 1 }),
    ).toBe("spatial");
    expect(
      playMapMarkerMode({ nationwideUnscoped: true, zoom: INDIVIDUAL_MARKER_MIN_ZOOM }),
    ).toBe("individual");
  });

  it("有明確縣市範圍時保留 local individual marker", () => {
    expect(playMapMarkerMode({ nationwideUnscoped: false, zoom: 8 })).toBe(
      "individual",
    );
  });
});

describe("clusterPlaygroundsByZoom", () => {
  it("相同網格 deterministic 聚合，單筆格保留原 place", () => {
    const places = [
      {
        ...base,
        id: "a",
        name: "A",
        city: "台北市",
        lat: 25.02,
        lng: 121.52,
      },
      {
        ...base,
        id: "b",
        name: "B",
        city: "台北市",
        lat: 25.04,
        lng: 121.54,
      },
      {
        ...base,
        id: "c",
        name: "C",
        city: "新竹市",
        lat: 24.8,
        lng: 120.96,
      },
    ] as Playground[];

    const clusters = clusterPlaygroundsByZoom(places, 11);
    expect(clusters).toHaveLength(2);
    expect(clusters.find((cluster) => cluster.count === 2)?.places.map((place) => place.id)).toEqual([
      "a",
      "b",
    ]);
    expect(clusters.find((cluster) => cluster.count === 1)?.places[0]?.id).toBe(
      "c",
    );
    expect(clusterPlaygroundsByZoom([...places].reverse(), 11)).toEqual(clusters);
  });
});
