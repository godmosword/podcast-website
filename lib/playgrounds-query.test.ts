import { describe, expect, test } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  isEasyParking,
  isHighEnergy,
  isOutdoorPlace,
  isRainyDayFriendly,
  isStrollerFriendly,
} from "@/lib/playground-context";
import {
  buildPlayMapQueryString,
  countByCity,
  countByType,
  filterPlaygrounds,
  isPlaygroundWithinBounds,
  listCoverageSummary,
  parsePlayMapQuery,
} from "@/lib/playgrounds-query";

describe("play-map 網址狀態", () => {
  test("parsePlayMapQuery 讀取合法參數", () => {
    expect(
      parsePlayMapQuery({
        city: "新北市",
        type: "公園",
        indoor: "1",
        free: "1",
        view: "map",
      }),
    ).toEqual({
      city: "新北市",
      type: "公園",
      indoorOnly: true,
      outdoorOnly: false,
      freeOnly: true,
      rainyDayOnly: false,
      parkingOnly: false,
      strollerFriendlyOnly: false,
      highEnergyOnly: false,
      view: "map",
    });
  });

  test("parsePlayMapQuery 無參數時 city 為 null（全部）", () => {
    expect(parsePlayMapQuery({})).toEqual({
      city: null,
      type: null,
      indoorOnly: false,
      outdoorOnly: false,
      freeOnly: false,
      rainyDayOnly: false,
      parkingOnly: false,
      strollerFriendlyOnly: false,
      highEnergyOnly: false,
      view: "cards",
    });
  });

  test("parsePlayMapQuery 對不合法值退回安全預設", () => {
    expect(
      parsePlayMapQuery({
        city: "火星市",
        type: "夜店",
        indoor: "yes",
        view: "3d",
      }),
    ).toEqual({
      city: null,
      type: null,
      indoorOnly: false,
      outdoorOnly: false,
      freeOnly: false,
      rainyDayOnly: false,
      parkingOnly: false,
      strollerFriendlyOnly: false,
      highEnergyOnly: false,
      view: "cards",
    });
  });

  test("parsePlayMapQuery 接受陣列型參數並取第一個", () => {
    const query = parsePlayMapQuery({ city: ["新北市", "台中市"] });
    expect(query.city).toBe("新北市");
  });

  test("buildPlayMapQueryString 省略全部預設（含 city null）", () => {
    expect(
      buildPlayMapQueryString({
        city: null,
        type: null,
        indoorOnly: false,
        outdoorOnly: false,
        freeOnly: false,
        rainyDayOnly: false,
        parkingOnly: false,
        strollerFriendlyOnly: false,
        highEnergyOnly: false,
        view: "cards",
      }),
    ).toBe("");
  });

  test("buildPlayMapQueryString 有縣市一律寫入", () => {
    expect(
      buildPlayMapQueryString({
        city: "台北市",
        type: null,
        indoorOnly: false,
        outdoorOnly: false,
        freeOnly: false,
        rainyDayOnly: false,
        parkingOnly: false,
        strollerFriendlyOnly: false,
        highEnergyOnly: false,
        view: "cards",
      }),
    ).toBe("city=%E5%8F%B0%E5%8C%97%E5%B8%82");
  });

  test("parse 與 build 對稱", () => {
    const original = {
      city: "台中市",
      type: "博物館" as const,
      indoorOnly: true,
      outdoorOnly: false,
      freeOnly: false,
      rainyDayOnly: false,
      parkingOnly: false,
      strollerFriendlyOnly: false,
      highEnergyOnly: false,
      view: "map" as const,
    };
    const qs = buildPlayMapQueryString(original);
    expect(
      parsePlayMapQuery(Object.fromEntries(new URLSearchParams(qs))),
    ).toEqual(original);
  });

  test("parsePlayMapQuery 讀取 contextual filter 參數", () => {
    expect(
      parsePlayMapQuery({
        outdoor: "1",
        rain: "1",
        parking: "1",
        stroller: "1",
        energy: "1",
      }),
    ).toMatchObject({
      outdoorOnly: true,
      rainyDayOnly: true,
      parkingOnly: true,
      strollerFriendlyOnly: true,
      highEnergyOnly: true,
    });
  });

  test("buildPlayMapQueryString 可分享 contextual filter 且保留舊參數", () => {
    expect(
      buildPlayMapQueryString({
        city: "桃園市",
        type: "公園",
        indoorOnly: false,
        outdoorOnly: true,
        freeOnly: true,
        rainyDayOnly: false,
        parkingOnly: true,
        strollerFriendlyOnly: true,
        highEnergyOnly: true,
        view: "cards",
      }),
    ).toBe(
      "city=%E6%A1%83%E5%9C%92%E5%B8%82&type=%E5%85%AC%E5%9C%92&outdoor=1&free=1&parking=1&stroller=1&energy=1",
    );
  });
});

describe("contextual playground filters", () => {
  const cases = [
    ["outdoorOnly", { outdoorOnly: true }, isOutdoorPlace],
    ["rainyDayOnly", { rainyDayOnly: true }, isRainyDayFriendly],
    ["parkingOnly", { parkingOnly: true }, isEasyParking],
    ["strollerFriendlyOnly", { strollerFriendlyOnly: true }, isStrollerFriendly],
    ["highEnergyOnly", { highEnergyOnly: true }, isHighEnergy],
  ] as const;

  for (const [name, filter, predicate] of cases) {
    test(`${name} 只回傳符合條件的地點`, () => {
      const result = filterPlaygrounds(filter);
      expect(result.length, name).toBeGreaterThan(0);
      expect(result.every(predicate), name).toBe(true);
    });
  }

  test("contextual filters 使用 AND semantics", () => {
    const result = filterPlaygrounds({
      city: "桃園市",
      freeOnly: true,
      outdoorOnly: true,
      parkingOnly: true,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (place) =>
          place.city === "桃園市" &&
          place.free &&
          isOutdoorPlace(place) &&
          isEasyParking(place),
      ),
    ).toBe(true);
  });

  test("city/type counts 會套用 contextual filters", () => {
    const filter = {
      outdoorOnly: true,
      parkingOnly: true,
      highEnergyOnly: true,
    };
    const result = filterPlaygrounds(filter);
    const byCity = countByCity(filter);
    const byType = countByType(filter);
    expect([...byCity.values()].reduce((sum, count) => sum + count, 0)).toBe(
      result.length,
    );
    expect([...byType.values()].reduce((sum, count) => sum + count, 0)).toBe(
      result.length,
    );
  });

  test("viewport bounds 與 structured filters 使用 AND semantics", () => {
    const bounds = {
      south: 24.9,
      west: 120.9,
      north: 25.2,
      east: 121.7,
    };
    const result = filterPlaygrounds({ freeOnly: true, bounds });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (place) =>
          place.free &&
          isPlaygroundWithinBounds(place, bounds),
      ),
    ).toBe(true);
    const byCity = countByCity({ freeOnly: true, bounds });
    expect([...byCity.values()].reduce((sum, count) => sum + count, 0)).toBe(
      result.length,
    );
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
