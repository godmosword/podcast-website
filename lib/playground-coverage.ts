/**
 * 親子遊樂地圖縣市覆蓋分級（editorial 契約）。
 * 門檻見 docs/PLAY-MAP-EDITORIAL.md。
 */
import { listPlaygrounds } from "@/data/playgrounds";

export type CoverageTier = "A" | "B" | "C";

export type CoverageStatus = "none" | "partial" | "met";

export type CityCoverage = {
  city: string;
  tier: CoverageTier;
  threshold: number;
  count: number;
  status: CoverageStatus;
};

/** 歷史預設縣市常數（文件／測試對照）；進頁預設已改為「全部」不鎖縣市。 */
export const DEFAULT_PLAY_MAP_CITY = "台北市" as const;

/** 親子遊樂地圖預設地圖中心（台北市區域）。 */
export const DEFAULT_PLAY_MAP_CENTER: [number, number] = [25.04, 121.55];

/** Tier A：六都＋新竹縣市；門檻 ≥8。 */
const TIER_A_CITIES = new Set([
  "臺北市",
  "台北市",
  "新北市",
  "桃園市",
  "臺中市",
  "台中市",
  "臺南市",
  "台南市",
  "高雄市",
  "新竹市",
  "新竹縣",
]);

/** Tier C：離島；門檻 ≥3。 */
const TIER_C_CITIES = new Set([
  "澎湖縣",
  "金門縣",
  "連江縣",
]);

export function coverageTierForCity(city: string): CoverageTier {
  if (TIER_A_CITIES.has(city)) return "A";
  if (TIER_C_CITIES.has(city)) return "C";
  return "B";
}

export function coverageThreshold(tier: CoverageTier): number {
  if (tier === "A") return 8;
  if (tier === "C") return 3;
  return 5;
}

export function coverageStatus(count: number, tier: CoverageTier): CoverageStatus {
  const threshold = coverageThreshold(tier);
  if (count <= 0) return "none";
  if (count >= threshold) return "met";
  return "partial";
}

/** 正規化顯示用縣市名（資料層統一用「台北市」時與「臺北市」對齊 tier）。 */
export function normalizeCityKey(city: string): string {
  return city.replace(/^台/, "臺");
}

export function listCityCoverage(): CityCoverage[] {
  const counts = new Map<string, number>();
  for (const place of listPlaygrounds()) {
    counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([city, count]) => {
      const tier = coverageTierForCity(normalizeCityKey(city));
      return {
        city,
        tier,
        threshold: coverageThreshold(tier),
        count,
        status: coverageStatus(count, tier),
      };
    })
    .sort((a, b) => a.city.localeCompare(b.city, "zh-Hant"));
}

/** 從縣市覆蓋表產生短摘要文案（不含波次硬編名單）。 */
export function coverageHeadline(
  rows: CityCoverage[] = listCityCoverage(),
): string {
  const cityCount = rows.length;
  const placeCount = rows.reduce((sum, row) => sum + row.count, 0);
  return `已收錄 ${cityCount} 縣市、共 ${placeCount} 處`;
}

/** Wave 1 必達縣市（北北基桃）。 */
export const WAVE1_CITIES = ["台北市", "新北市", "基隆市", "桃園市"] as const;

export function assertWave1CoverageMet(
  rows: CityCoverage[] = listCityCoverage(),
): { ok: boolean; missing: string[] } {
  const byCity = new Map(rows.map((row) => [row.city, row]));
  const missing: string[] = [];
  for (const city of WAVE1_CITIES) {
    const row = byCity.get(city);
    if (!row || row.status !== "met") {
      missing.push(city);
    }
  }
  return { ok: missing.length === 0, missing };
}

/** Wave 2 必達縣市（竹苗中彰投雲）。 */
export const WAVE2_CITIES = [
  "新竹市",
  "新竹縣",
  "苗栗縣",
  "台中市",
  "彰化縣",
  "南投縣",
  "雲林縣",
] as const;

export function assertWave2CoverageMet(
  rows: CityCoverage[] = listCityCoverage(),
): { ok: boolean; missing: string[] } {
  const byCity = new Map(rows.map((row) => [row.city, row]));
  const missing: string[] = [];
  for (const city of WAVE2_CITIES) {
    const row = byCity.get(city);
    if (!row || row.status !== "met") {
      missing.push(city);
    }
  }
  return { ok: missing.length === 0, missing };
}
