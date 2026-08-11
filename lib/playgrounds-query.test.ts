import { describe, expect, test } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  buildPlayMapQueryString,
  countByCity,
  countByType,
  filterPlaygrounds,
  listCoverageSummary,
  parsePlayMapQuery,
} from "@/lib/playgrounds-query";

const DEFAULT_CITY = "台北市";

describe("play-map 網址狀態", () => {
  test("parsePlayMapQuery 讀取合法參數", () => {
    expect(
      parsePlayMapQuery(
        { city: "新北市", type: "公園", indoor: "1", free: "1", view: "map" },
        DEFAULT_CITY,
      ),
    ).toEqual({
      city: "新北市",
      type: "公園",
      indoorOnly: true,
      freeOnly: true,
      view: "map",
    });
  });

  test("parsePlayMapQuery 對不合法值退回預設", () => {
    expect(
      parsePlayMapQuery(
        { city: "火星市", type: "夜店", indoor: "yes", view: "3d" },
        DEFAULT_CITY,
      ),
    ).toEqual({
      city: DEFAULT_CITY,
      type: null,
      indoorOnly: false,
      freeOnly: false,
      view: "cards",
    });
  });

  test("parsePlayMapQuery 接受陣列型參數並取第一個", () => {
    const query = parsePlayMapQuery({ city: ["新北市", "台中市"] }, DEFAULT_CITY);
    expect(query.city).toBe("新北市");
  });

  test("buildPlayMapQueryString 省略等於預設的值", () => {
    expect(
      buildPlayMapQueryString(
        {
          city: DEFAULT_CITY,
          type: null,
          indoorOnly: false,
          freeOnly: false,
          view: "cards",
        },
        DEFAULT_CITY,
      ),
    ).toBe("");
  });

  test("parse 與 build 對稱", () => {
    const original = {
      city: "台中市",
      type: "博物館" as const,
      indoorOnly: true,
      freeOnly: false,
      view: "map" as const,
    };
    const qs = buildPlayMapQueryString(original, DEFAULT_CITY);
    expect(
      parsePlayMapQuery(
        Object.fromEntries(new URLSearchParams(qs)),
        DEFAULT_CITY,
      ),
    ).toEqual(original);
  });
});

describe("countByCity", () => {
  test("各縣市加總等於該條件下的總筆數", () => {
    const counts = countByCity({ freeOnly: true });
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    expect(total).toBe(filterPlaygrounds({ freeOnly: true }).length);
  });

  test("與 countByType 同語意：都會跟隨其他條件收斂", () => {
    const all = countByCity();
    const indoorOnly = countByCity({ indoorOnly: true });
    for (const [city, count] of indoorOnly) {
      expect(count).toBeLessThanOrEqual(all.get(city) ?? 0);
    }
  });
});

describe("countByType", () => {
  test("各類型加總等於該條件下的總筆數", () => {
    const counts = countByType({ city: "台北市" });
    const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
    expect(total).toBe(filterPlaygrounds({ city: "台北市" }).length);
  });

  test("計數會跟隨 indoor／free 條件收斂", () => {
    const all = countByType({ city: "台北市" });
    const freeOnly = countByType({ city: "台北市", freeOnly: true });
    for (const [type, count] of freeOnly) {
      expect(count).toBeLessThanOrEqual(all.get(type) ?? 0);
    }
  });
});

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
