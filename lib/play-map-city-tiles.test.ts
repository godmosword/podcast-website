import { describe, expect, it } from "vitest";
import { CITY_DISPLAY_ORDER, listCities } from "@/data/playgrounds";
import {
  CITY_WALL_COLUMNS,
  CITY_WALL_ROWS,
  CITY_WALL_SLOTS,
  buildPlayMapCityTiles,
  cityTileDensity,
  listUncataloguedCities,
  uncataloguedNotice,
} from "./play-map-city-tiles";

function countsOf(entries: readonly [string, number][]) {
  return new Map(entries);
}

describe("CITY_WALL_SLOTS", () => {
  it("涵蓋 CITY_DISPLAY_ORDER 的全部縣市，一個不多一個不少", () => {
    expect([...CITY_WALL_SLOTS.map((slot) => slot.city)].sort()).toEqual(
      [...CITY_DISPLAY_ORDER].sort(),
    );
  });

  it("每個磚位唯一，且落在 4 欄 7 列之內", () => {
    const seen = new Set<string>();
    for (const slot of CITY_WALL_SLOTS) {
      const key = `${slot.row}-${slot.col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      expect(slot.row).toBeGreaterThanOrEqual(1);
      expect(slot.row).toBeLessThanOrEqual(CITY_WALL_ROWS);
      expect(slot.col).toBeGreaterThanOrEqual(1);
      expect(slot.col).toBeLessThanOrEqual(CITY_WALL_COLUMNS);
    }
  });
});

describe("cityTileDensity", () => {
  it("0 筆恆為 0 階，其餘落在 1–4 階", () => {
    expect(cityTileDensity(0, 10)).toBe(0);
    expect(cityTileDensity(5, 0)).toBe(0);
    for (let count = 1; count <= 10; count += 1) {
      const density = cityTileDensity(count, 10);
      expect(density).toBeGreaterThanOrEqual(1);
      expect(density).toBeLessThanOrEqual(4);
    }
  });

  it("最大值恆為最深階，且階梯不遞減", () => {
    expect(cityTileDensity(10, 10)).toBe(4);
    let previous = 0;
    for (let count = 1; count <= 10; count += 1) {
      const density = cityTileDensity(count, 10);
      expect(density).toBeGreaterThanOrEqual(previous);
      previous = density;
    }
  });
});

describe("buildPlayMapCityTiles", () => {
  it("已收錄但此條件 0 筆，與尚未收錄是兩種狀態", () => {
    const tiles = buildPlayMapCityTiles({
      counts: countsOf([["桃園市", 10]]),
      coveredCities: ["桃園市", "台北市"],
    });
    const taipei = tiles.find((tile) => tile.city === "台北市")!;
    const yilan = tiles.find((tile) => tile.city === "宜蘭縣")!;

    expect(taipei.status).toBe("empty");
    expect(taipei.statusLabel).toBe("0 個");
    expect(yilan.status).toBe("uncatalogued");
    expect(yilan.statusLabel).toBe("未收錄");
    expect(yilan.ariaLabel).toBe("宜蘭縣，尚未收錄");
  });

  it("命中數同時是可見文字，色深不是唯一編碼", () => {
    const tiles = buildPlayMapCityTiles({
      counts: countsOf([
        ["桃園市", 10],
        ["台北市", 3],
      ]),
      coveredCities: ["桃園市", "台北市"],
    });
    const taoyuan = tiles.find((tile) => tile.city === "桃園市")!;

    expect(taoyuan.statusLabel).toBe("10 個");
    expect(taoyuan.ariaLabel).toBe("桃園市，10 個地點");
    expect(taoyuan.density).toBe(4);
    for (const tile of tiles) {
      expect(tile.statusLabel.length).toBeGreaterThan(0);
    }
  });

  it("未收錄縣市不吃 counts，永遠是 0 筆 0 階", () => {
    const tiles = buildPlayMapCityTiles({
      counts: countsOf([["宜蘭縣", 7]]),
      coveredCities: ["桃園市"],
    });
    const yilan = tiles.find((tile) => tile.city === "宜蘭縣")!;
    expect(yilan.count).toBe(0);
    expect(yilan.density).toBe(0);
  });

  it("預設用實際資料的縣市清單，磚數恆為 22", () => {
    const tiles = buildPlayMapCityTiles({ counts: countsOf([]) });
    expect(tiles).toHaveLength(CITY_WALL_SLOTS.length);
    expect(tiles).toHaveLength(22);
  });
});

describe("listUncataloguedCities / uncataloguedNotice", () => {
  it("目前資料缺的是宜蘭花東屏東與離島", () => {
    expect(listUncataloguedCities()).toEqual([
      "屏東縣",
      "宜蘭縣",
      "花蓮縣",
      "台東縣",
      "澎湖縣",
      "金門縣",
      "連江縣",
    ]);
  });

  it("已收錄清單與資料一致，差集不重疊", () => {
    const covered = new Set(listCities());
    for (const city of listUncataloguedCities()) {
      expect(covered.has(city)).toBe(false);
    }
  });

  it("聲明含全部未收錄縣市名，並明說沒收錄不等於沒地方玩", () => {
    const notice = uncataloguedNotice(listUncataloguedCities());
    for (const city of listUncataloguedCities()) {
      expect(notice).toContain(city);
    }
    expect(notice).toContain("不代表當地沒有好去處");
  });

  it("依北到南排序，不用字典序", () => {
    expect(uncataloguedNotice(["連江縣", "宜蘭縣", "花蓮縣"])).toBe(
      "宜蘭縣、花蓮縣、連江縣尚未收錄，不代表當地沒有好去處。",
    );
  });

  it("全部收錄時不留空句子", () => {
    expect(uncataloguedNotice([])).toBe("");
  });
});
