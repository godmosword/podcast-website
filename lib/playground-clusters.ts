/**
 * 全國視角把地點收成縣市聚合，避免 73 根針糊成一團。
 */
import type { Playground } from "@/data/playgrounds";

export type CityCluster = {
  city: string;
  count: number;
  lat: number;
  lng: number;
};

export function clusterPlaygroundsByCity(
  places: readonly Playground[],
): CityCluster[] {
  const buckets = new Map<
    string,
    { count: number; latSum: number; lngSum: number }
  >();

  for (const place of places) {
    const prev = buckets.get(place.city);
    if (prev) {
      prev.count += 1;
      prev.latSum += place.lat;
      prev.lngSum += place.lng;
    } else {
      buckets.set(place.city, {
        count: 1,
        latSum: place.lat,
        lngSum: place.lng,
      });
    }
  }

  return [...buckets.entries()]
    .map(([city, bucket]) => ({
      city,
      count: bucket.count,
      lat: bucket.latSum / bucket.count,
      lng: bucket.lngSum / bucket.count,
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "zh-Hant"));
}

/** 未選縣市且未定位：地圖走縣市聚合，名單提示先縮小範圍。 */
export function isNationwideUnscoped(
  city: string | null,
  hasUserLocation: boolean,
): boolean {
  return city === null && !hasUserLocation;
}
