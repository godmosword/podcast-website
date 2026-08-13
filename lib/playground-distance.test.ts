import { describe, expect, test } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  estimateDriveMinutes,
  formatDriveMinutesLabel,
  formatPlaceDistanceLabel,
  haversineKm,
  isStrollerFriendly,
  listPlaceDecisionTags,
  pickNearest,
  sortPlaygrounds,
} from "@/lib/playground-distance";

describe("haversineKm", () => {
  test("同一點距離為 0", () => {
    expect(haversineKm({ lat: 25, lng: 121 }, { lat: 25, lng: 121 })).toBe(0);
  });

  test("台北到桃園大約 20–40 km", () => {
    const km = haversineKm(
      { lat: 25.04, lng: 121.55 },
      { lat: 25.0, lng: 121.3 },
    );
    expect(km).toBeGreaterThan(20);
    expect(km).toBeLessThan(40);
  });
});

describe("estimateDriveMinutes", () => {
  test("clamp 到 1–90", () => {
    expect(estimateDriveMinutes(0)).toBe(1);
    expect(estimateDriveMinutes(0.1)).toBe(1);
    expect(estimateDriveMinutes(100)).toBe(90);
  });
});

describe("formatPlaceDistanceLabel", () => {
  test("無定位不顯示", () => {
    expect(
      formatPlaceDistanceLabel({ lat: 25, lng: 121 }, null),
    ).toBeNull();
  });

  test("觸頂改為 90 分以上", () => {
    const label = formatPlaceDistanceLabel(
      { lat: 22.6, lng: 120.3 },
      { lat: 25.04, lng: 121.55 },
    );
    expect(label).toBe("車程 90 分以上");
  });
});

const PLACE_BASE = {
  district: "區",
  lat: 0,
  lng: 0,
  address: "x",
  type: "公園" as const,
  ageRange: [3, 8] as [number, number],
  indoor: false,
  facilities: [] as string[],
  tags: [] as string[],
  sources: [],
  lastVerified: "2026-01-01",
};

describe("sortPlaygrounds", () => {
  test("無定位：免費優先再依名稱", () => {
    const places = [
      {
        ...PLACE_BASE,
        id: "b",
        name: "公園B",
        city: "台北市",
        free: false,
        lat: 1,
        lng: 1,
      },
      {
        ...PLACE_BASE,
        id: "a",
        name: "公園A",
        city: "台北市",
        free: true,
        lat: 2,
        lng: 2,
      },
      {
        ...PLACE_BASE,
        id: "c",
        name: "公園C",
        city: "台北市",
        free: true,
        lat: 3,
        lng: 3,
      },
    ] as Playground[];
    expect(sortPlaygrounds(places, null).map((p) => p.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  test("有定位：近到遠", () => {
    const user = { lat: 0, lng: 0 };
    const places = [
      {
        ...PLACE_BASE,
        id: "far",
        name: "遠",
        city: "台北市",
        free: true,
        lat: 1,
        lng: 1,
      },
      {
        ...PLACE_BASE,
        id: "near",
        name: "近",
        city: "台北市",
        free: false,
        lat: 0.01,
        lng: 0.01,
      },
    ] as Playground[];
    expect(sortPlaygrounds(places, user).map((p) => p.id)).toEqual([
      "near",
      "far",
    ]);
  });
});

describe("pickNearest", () => {
  const user = { lat: 0, lng: 0 };
  const places = [
    {
      ...PLACE_BASE,
      id: "far",
      name: "遠",
      city: "台北市",
      free: true,
      lat: 1,
      lng: 1,
    },
    {
      ...PLACE_BASE,
      id: "mid",
      name: "中",
      city: "台北市",
      free: true,
      lat: 0.5,
      lng: 0.5,
    },
    {
      ...PLACE_BASE,
      id: "near",
      name: "近",
      city: "台北市",
      free: false,
      lat: 0.01,
      lng: 0.01,
    },
  ] as Playground[];

  test("取最近 n 筆、不修改原陣列", () => {
    const originalIds = places.map((place) => place.id);
    expect(pickNearest(places, user, 2).map((place) => place.id)).toEqual([
      "near",
      "mid",
    ]);
    expect(places.map((place) => place.id)).toEqual(originalIds);
  });

  test("n 大於筆數時回傳全部、n<=0 回傳空", () => {
    expect(pickNearest(places, user, 10)).toHaveLength(3);
    expect(pickNearest(places, user, 0)).toEqual([]);
    expect(pickNearest(places, user, -1)).toEqual([]);
  });
});

describe("isStrollerFriendly", () => {
  test("推車友善正面才 true", () => {
    expect(
      isStrollerFriendly({
        tags: ["推車友善"],
        facilities: [],
        tips: undefined,
      }),
    ).toBe(true);
    expect(
      isStrollerFriendly({
        tags: [],
        facilities: [],
        tips: "推車慎選路線",
      }),
    ).toBe(false);
  });
});

describe("listPlaceDecisionTags", () => {
  test("只輸出有資料的標籤", () => {
    const tags = listPlaceDecisionTags({
      free: true,
      indoor: true,
      ageRange: [3, 8],
      tags: ["推車友善"],
      facilities: [],
      tips: undefined,
    });
    expect(tags).toEqual(["免費", "室內", "推車友善", "3–8 歲"]);
  });
});
