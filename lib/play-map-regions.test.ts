import { describe, expect, it } from "vitest";
import { CITY_DISPLAY_ORDER, listCities } from "@/data/playgrounds";
import {
  PLAY_MAP_REGIONS,
  buildPlayMapRegions,
  listUncataloguedCities,
  uncataloguedNotice,
} from "./play-map-regions";

function countsOf(entries: readonly [string, number][]) {
  return new Map(entries);
}

describe("PLAY_MAP_REGIONS", () => {
  it("涵蓋 CITY_DISPLAY_ORDER 的全部縣市，一個不多一個不少", () => {
    const all = PLAY_MAP_REGIONS.flatMap((region) => region.cities);
    expect([...all].sort()).toEqual([...CITY_DISPLAY_ORDER].sort());
  });

  it("每個縣市只屬於一個區域", () => {
    const all = PLAY_MAP_REGIONS.flatMap((region) => region.cities);
    expect(new Set(all).size).toBe(all.length);
  });

  it("區域依北中南東排列，組內沿用 CITY_DISPLAY_ORDER", () => {
    expect(PLAY_MAP_REGIONS.map((region) => region.label)).toEqual([
      "北部",
      "中部",
      "南部",
      "東部與離島",
    ]);
    for (const region of PLAY_MAP_REGIONS) {
      const sorted = [...region.cities].sort(
        (a, b) => CITY_DISPLAY_ORDER.indexOf(a) - CITY_DISPLAY_ORDER.indexOf(b),
      );
      expect(region.cities).toEqual(sorted);
    }
  });
});

describe("buildPlayMapRegions", () => {
  it("只輸出已收錄縣市，未收錄縣市不做成按鈕", () => {
    const regions = buildPlayMapRegions({ counts: countsOf([]) });
    const cities = regions.flatMap((region) => region.cities.map((item) => item.city));
    expect([...cities].sort()).toEqual([...listCities()].sort());
    for (const city of listUncataloguedCities()) {
      expect(cities).not.toContain(city);
    }
  });

  it("沒有任何已收錄縣市的區域整組略過", () => {
    const regions = buildPlayMapRegions({
      counts: countsOf([["桃園市", 3]]),
      coveredCities: ["桃園市"],
    });
    expect(regions.map((region) => region.key)).toEqual(["north"]);
  });

  it("已收錄但此條件 0 筆是 empty，仍輸出可點的縣市", () => {
    const regions = buildPlayMapRegions({
      counts: countsOf([["桃園市", 10]]),
      coveredCities: ["桃園市", "台北市"],
    });
    const north = regions.find((region) => region.key === "north")!;
    const taipei = north.cities.find((item) => item.city === "台北市")!;
    const taoyuan = north.cities.find((item) => item.city === "桃園市")!;

    expect(taipei).toEqual({
      city: "台北市",
      count: 0,
      status: "empty",
      ariaLabel: "台北市，0 個地點",
    });
    expect(taoyuan.status).toBe("covered");
    expect(taoyuan.ariaLabel).toBe("桃園市，10 個地點");
  });

  it("預設資料：北中南三區，數量加總等於傳入的 counts", () => {
    const counts = new Map(listCities().map((city) => [city, 2] as const));
    const regions = buildPlayMapRegions({ counts });
    expect(regions.map((region) => region.label)).toEqual(["北部", "中部", "南部"]);
    const total = regions
      .flatMap((region) => region.cities)
      .reduce((sum, item) => sum + item.count, 0);
    expect(total).toBe(listCities().length * 2);
  });
});

describe("listUncataloguedCities / uncataloguedNotice", () => {
  it("目前資料缺的是宜蘭花東屏東與離島，依北到南排序", () => {
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

  it("聲明含全部未收錄縣市名，並明說沒收錄不等於沒地方玩", () => {
    const notice = uncataloguedNotice(listUncataloguedCities());
    for (const city of listUncataloguedCities()) {
      expect(notice).toContain(city);
    }
    expect(notice).toContain("不代表當地沒有好去處");
  });

  it("依北到南排序，不用字典序", () => {
    expect(uncataloguedNotice(["連江縣", "宜蘭縣", "花蓮縣"])).toBe(
      "尚未收錄：宜蘭縣、花蓮縣、連江縣。不代表當地沒有好去處。",
    );
  });

  it("全部收錄時不留空句子", () => {
    expect(uncataloguedNotice([])).toBe("");
  });
});
