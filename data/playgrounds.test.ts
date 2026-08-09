import { describe, expect, it } from "vitest";
import {
  getPlayground,
  listCities,
  listPlaygrounds,
  type Playground,
} from "./playgrounds";

const VALID_TYPES = new Set([
  "公園",
  "室內樂園",
  "博物館",
  "農場",
  "室內放電",
  "其他",
]);

function assertPlaygroundShape(item: Playground): void {
  expect(item.id.trim().length, item.id).toBeGreaterThan(0);
  expect(item.name.trim().length, item.id).toBeGreaterThan(0);
  expect(item.city.trim().length, item.id).toBeGreaterThan(0);
  expect(item.address.trim().length, item.id).toBeGreaterThan(0);
  expect(VALID_TYPES.has(item.type), item.id).toBe(true);
  expect(item.ageRange).toHaveLength(2);
  expect(item.ageRange[0], item.id).toBeLessThanOrEqual(item.ageRange[1]);
  expect(item.lat, item.id).toBeGreaterThan(21);
  expect(item.lat, item.id).toBeLessThan(27);
  expect(item.lng, item.id).toBeGreaterThan(119);
  expect(item.lng, item.id).toBeLessThan(123);
  expect(Array.isArray(item.facilities), item.id).toBe(true);
  expect(Array.isArray(item.tags), item.id).toBe(true);
}

describe("playgrounds sidecar", () => {
  it("示範資料至少 3 筆且欄位完整", () => {
    const items = listPlaygrounds();
    expect(items.length).toBeGreaterThanOrEqual(3);
    for (const item of items) {
      assertPlaygroundShape(item);
    }
  });

  it("id 不重複", () => {
    const ids = listPlaygrounds().map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("getPlayground 可依 id 取得", () => {
    const first = listPlaygrounds()[0];
    expect(getPlayground(first.id)).toEqual(first);
    expect(getPlayground("does-not-exist")).toBeUndefined();
  });

  it("listCities 去重且排序", () => {
    const cities = listCities();
    expect(cities.length).toBeGreaterThan(0);
    expect(cities).toEqual([...new Set(cities)].sort((a, b) => a.localeCompare(b, "zh-Hant")));
    for (const city of cities) {
      expect(listPlaygrounds().some((item) => item.city === city)).toBe(true);
    }
  });

  it("示範資料以桃園為主", () => {
    const taoyuanCount = listPlaygrounds().filter((item) =>
      item.city.includes("桃園"),
    ).length;
    expect(taoyuanCount).toBeGreaterThanOrEqual(3);
  });
});
