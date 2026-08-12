import { describe, expect, test } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  estimateDriveMinutes,
  formatDriveMinutesLabel,
  haversineKm,
  isStrollerFriendly,
  listPlaceDecisionTags,
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

describe("formatDriveMinutesLabel", () => {
  test("繁中文案", () => {
    expect(formatDriveMinutesLabel(18)).toBe("約 18 分鐘");
  });
});

describe("sortPlaygrounds", () => {
  const base = {
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

  test("無定位：免費優先再依名稱", () => {
    const places = [
      {
        ...base,
        id: "b",
        name: "公園B",
        city: "台北市",
        free: false,
        lat: 1,
        lng: 1,
      },
      {
        ...base,
        id: "a",
        name: "公園A",
        city: "台北市",
        free: true,
        lat: 2,
        lng: 2,
      },
      {
        ...base,
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
        ...base,
        id: "far",
        name: "遠",
        city: "台北市",
        free: true,
        lat: 1,
        lng: 1,
      },
      {
        ...base,
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

describe("isStrollerFriendly", () => {
  test("推車友善正面才 true", () => {
    expect(
      isStrollerFriendly({
        tags: ["推車友善"],
        facilities: [],
        tips: undefined,
      } as Playground),
    ).toBe(true);
    expect(
      isStrollerFriendly({
        tags: [],
        facilities: [],
        tips: "推車慎選路線",
      } as Playground),
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
    } as Playground);
    expect(tags).toEqual(["免費", "室內", "推車友善", "3–8 歲"]);
  });
});
