import { describe, expect, it } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  assertWave1CoverageMet,
  assertWave2CoverageMet,
  coverageHeadline,
  coverageStatus,
  coverageThreshold,
  coverageTierForCity,
  DEFAULT_PLAY_MAP_CITY,
  listCityCoverage,
  normalizeCityKey,
  WAVE1_CITIES,
  WAVE2_CITIES,
} from "@/lib/playground-coverage";

describe("playground-coverage", () => {
  it("DEFAULT_PLAY_MAP_CITY 為台北市", () => {
    expect(DEFAULT_PLAY_MAP_CITY).toBe("台北市");
  });

  it("coverageHeadline 產生縣市與總筆數摘要", () => {
    const rows = listCityCoverage();
    const headline = coverageHeadline(rows);
    const cityCount = rows.length;
    const placeCount = rows.reduce((sum, row) => sum + row.count, 0);
    expect(headline).toBe(`已收錄 ${cityCount} 縣市、共 ${placeCount} 處`);
  });

  it("coverageTierForCity 分級正確", () => {
    expect(coverageTierForCity("台北市")).toBe("A");
    expect(coverageTierForCity("臺北市")).toBe("A");
    expect(coverageTierForCity("新北市")).toBe("A");
    expect(coverageTierForCity("桃園市")).toBe("A");
    expect(coverageTierForCity("基隆市")).toBe("B");
    expect(coverageTierForCity("澎湖縣")).toBe("C");
  });

  it("coverageThreshold 依 tier 回傳門檻", () => {
    expect(coverageThreshold("A")).toBe(8);
    expect(coverageThreshold("B")).toBe(5);
    expect(coverageThreshold("C")).toBe(3);
  });

  it("coverageStatus 依筆數與 tier 判斷", () => {
    expect(coverageStatus(0, "A")).toBe("none");
    expect(coverageStatus(3, "A")).toBe("partial");
    expect(coverageStatus(8, "A")).toBe("met");
    expect(coverageStatus(4, "B")).toBe("partial");
    expect(coverageStatus(5, "B")).toBe("met");
  });

  it("normalizeCityKey 台臺對齊", () => {
    expect(normalizeCityKey("台北市")).toBe("臺北市");
    expect(normalizeCityKey("臺北市")).toBe("臺北市");
  });

  /*
   * 覆蓋只計「現在帶得成小孩去」的場館，休園中的不算——把去不了的地方
   * 算進「共 N 處」等於對外灌水，tier 門檻也會被墊高一格。
   */
  it("listCityCoverage 加總等於可造訪場館數，休園者不計", () => {
    const rows = listCityCoverage();
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const open = listPlaygrounds().filter(
      (place) => place.status !== "temporarily-closed",
    );
    expect(total).toBe(open.length);
    for (const row of rows) {
      expect(row.threshold).toBe(coverageThreshold(row.tier));
      expect(row.status).toBe(coverageStatus(row.count, row.tier));
    }
  });

  it("休園場館確實被排除在覆蓋之外", () => {
    const closed = listPlaygrounds().filter(
      (place) => place.status === "temporarily-closed",
    );
    if (closed.length === 0) return;
    const rows = listCityCoverage();
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(listPlaygrounds().length - closed.length);
  });

  it("Wave 1 四縣市皆達門檻", () => {
    const { ok, missing } = assertWave1CoverageMet();
    expect(missing).toEqual([]);
    expect(ok).toBe(true);

    const rows = listCityCoverage();
    for (const city of WAVE1_CITIES) {
      const row = rows.find((r) => r.city === city);
      expect(row, city).toBeDefined();
      expect(row?.status).toBe("met");
    }
  });

  it("Wave 2 七縣市皆達門檻", () => {
    const { ok, missing } = assertWave2CoverageMet();
    expect(missing).toEqual([]);
    expect(ok).toBe(true);

    const rows = listCityCoverage();
    for (const city of WAVE2_CITIES) {
      const row = rows.find((r) => r.city === city);
      expect(row, city).toBeDefined();
      expect(row?.status).toBe("met");
    }
  });
});
