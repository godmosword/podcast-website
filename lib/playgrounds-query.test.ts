import { describe, expect, test } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  filterPlaygrounds,
  listCoverageSummary,
} from "@/lib/playgrounds-query";

describe("playgrounds-query", () => {
  test("filterPlaygrounds 預設回全部", () => {
    expect(filterPlaygrounds()).toHaveLength(listPlaygrounds().length);
  });

  test("filterPlaygrounds 可依 city 篩選", () => {
    const taoyuan = filterPlaygrounds({ city: "桃園市" });
    expect(taoyuan.length).toBeGreaterThan(0);
    expect(taoyuan.every((p) => p.city === "桃園市")).toBe(true);
  });

  test("filterPlaygrounds 可依 indoorOnly 篩選", () => {
    const indoor = filterPlaygrounds({ indoorOnly: true });
    expect(indoor.length).toBeGreaterThan(0);
    expect(indoor.every((p) => p.indoor)).toBe(true);
  });

  test("filterPlaygrounds 可依 freeOnly 篩選", () => {
    const free = filterPlaygrounds({ freeOnly: true });
    expect(free.length).toBeGreaterThan(0);
    expect(free.every((p) => p.free)).toBe(true);
  });

  test("filterPlaygrounds 可依 type 篩選", () => {
    const parks = filterPlaygrounds({ type: "公園" });
    expect(parks.length).toBeGreaterThan(0);
    expect(parks.every((p) => p.type === "公園")).toBe(true);
  });

  test("filterPlaygrounds 可組合多條件", () => {
    const result = filterPlaygrounds({
      city: "桃園市",
      indoorOnly: true,
      freeOnly: true,
    });
    expect(
      result.every((p) => p.city === "桃園市" && p.indoor && p.free),
    ).toBe(true);
  });

  test("listCoverageSummary 回傳各縣市筆數", () => {
    const summary = listCoverageSummary();
    expect(summary.length).toBeGreaterThan(0);
    const total = summary.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(listPlaygrounds().length);
    expect(summary).toEqual(
      [...summary].sort((a, b) => a.city.localeCompare(b.city, "zh-Hant")),
    );
  });
});
