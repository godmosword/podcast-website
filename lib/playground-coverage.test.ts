import { describe, expect, it } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  assertWave1CoverageMet,
  assertWave2CoverageMet,
  coverageStatus,
  coverageThreshold,
  coverageTierForCity,
  listCityCoverage,
  normalizeCityKey,
  WAVE1_CITIES,
  WAVE2_CITIES,
} from "@/lib/playground-coverage";

describe("playground-coverage", () => {
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

  it("listCityCoverage 加總與資料一致", () => {
    const rows = listCityCoverage();
    const total = rows.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(listPlaygrounds().length);
    for (const row of rows) {
      expect(row.threshold).toBe(coverageThreshold(row.tier));
      expect(row.status).toBe(coverageStatus(row.count, row.tier));
    }
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
