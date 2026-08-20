/**
 * 縣市遊樂資料摘要：免費／室內佔比給全國層卡片用。
 */
import { listCities, listPlaygrounds, type Playground } from "@/data/playgrounds";

export type CityPlayStats = {
  city: string;
  total: number;
  free: number;
  notFree: number;
  indoor: number;
  outdoor: number;
};

export function listCityPlayStats(
  places: readonly Playground[] = listPlaygrounds(),
): CityPlayStats[] {
  const buckets = new Map<string, { total: number; free: number; indoor: number }>();
  for (const place of places) {
    const prev = buckets.get(place.city);
    if (prev) {
      prev.total += 1;
      if (place.free) prev.free += 1;
      if (place.indoor) prev.indoor += 1;
    } else {
      buckets.set(place.city, {
        total: 1,
        free: place.free ? 1 : 0,
        indoor: place.indoor ? 1 : 0,
      });
    }
  }

  const ordered = listCities().filter((city) => buckets.has(city));
  const extra = [...buckets.keys()]
    .filter((city) => !ordered.includes(city))
    .sort((a, b) => a.localeCompare(b, "zh-Hant"));

  return [...ordered, ...extra].map((city) => {
    const bucket = buckets.get(city)!;
    return {
      city,
      total: bucket.total,
      free: bucket.free,
      notFree: bucket.total - bucket.free,
      indoor: bucket.indoor,
      outdoor: bucket.total - bucket.indoor,
    };
  });
}
