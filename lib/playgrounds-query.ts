/**
 * 親子遊樂地圖查詢 resolver。
 * UI 應先讓使用者選縣市再篩選；city 省略時回傳全部（供測試與後台統計）。
 */
import {
  listPlaygrounds,
  type Playground,
  type PlaygroundType,
} from "@/data/playgrounds";

export type PlaygroundFilter = {
  city?: string;
  indoorOnly?: boolean;
  freeOnly?: boolean;
  type?: PlaygroundType;
};

export type CoverageSummary = {
  city: string;
  count: number;
};

export function filterPlaygrounds(filter: PlaygroundFilter = {}): Playground[] {
  const { city, indoorOnly, freeOnly, type } = filter;
  return listPlaygrounds().filter((place) => {
    if (city !== undefined && place.city !== city) return false;
    if (indoorOnly && !place.indoor) return false;
    if (freeOnly && !place.free) return false;
    if (type !== undefined && place.type !== type) return false;
    return true;
  });
}

export function listCoverageSummary(): CoverageSummary[] {
  const counts = new Map<string, number>();
  for (const place of listPlaygrounds()) {
    counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => a.city.localeCompare(b.city, "zh-Hant"));
}
