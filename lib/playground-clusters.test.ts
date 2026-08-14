import { describe, expect, it } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  clusterPlaygroundsByCity,
  isNationwideUnscoped,
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
