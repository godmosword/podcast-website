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

export type SpatialCluster = {
  id: string;
  count: number;
  lat: number;
  lng: number;
  places: readonly Playground[];
};

/**
 * 以台灣全台 overview 的現有 fit 行為為基準：
 * - 8 級以下仍維持縣市 aggregate
 * - 9–12 級以區域網格聚合
 * - 13 級以上讓單點針接手
 *
 * DEFAULT_ZOOM 是 11，既有 FitBounds 的 maxZoom 是 14；這組邊界讓
 * 初始全台視角保留縣市語意，放大到區域後才逐步拆解，不依賴外部套件。
 */
export const CITY_AGGREGATE_MAX_ZOOM = 8;
export const INDIVIDUAL_MARKER_MIN_ZOOM = 13;

export type PlayMapMarkerMode = "city" | "spatial" | "individual";

export function playMapMarkerMode(args: {
  nationwideUnscoped: boolean;
  zoom: number;
}): PlayMapMarkerMode {
  // 明確縣市／附近已是 local scope，保留 PR2 的 individual marker 行為；
  // spatial transition 只發生在全台探索逐步放大的過程。
  if (!args.nationwideUnscoped) return "individual";
  if (args.nationwideUnscoped && args.zoom <= CITY_AGGREGATE_MAX_ZOOM) {
    return "city";
  }
  if (args.zoom < INDIVIDUAL_MARKER_MIN_ZOOM) return "spatial";
  return "individual";
}

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

/**
 * 小型 deterministic geographic grid。只有同一格內超過一筆才會成為
 * spatial cluster；單筆格仍會回傳，讓 marker renderer 能共用同一份結果。
 */
export function clusterPlaygroundsByZoom(
  places: readonly Playground[],
  zoom: number,
): SpatialCluster[] {
  const cellDegrees = 0.5 / 2 ** Math.max(0, Math.min(zoom, 12) - 9);
  const buckets = new Map<string, Playground[]>();

  for (const place of places) {
    const latCell = Math.floor(place.lat / cellDegrees);
    const lngCell = Math.floor(place.lng / cellDegrees);
    const key = `${latCell}:${lngCell}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(place);
    else buckets.set(key, [place]);
  }

  return [...buckets.entries()]
    .map(([id, bucket]) => ({
      id: `spatial-${id}`,
      count: bucket.length,
      lat: bucket.reduce((sum, place) => sum + place.lat, 0) / bucket.length,
      lng: bucket.reduce((sum, place) => sum + place.lng, 0) / bucket.length,
      places: [...bucket].sort((a, b) => a.id.localeCompare(b.id)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** 未選縣市且未定位：地圖走縣市聚合，名單提示先縮小範圍。 */
export function isNationwideUnscoped(
  city: string | null,
  hasUserLocation: boolean,
): boolean {
  return city === null && !hasUserLocation;
}
