/**
 * 縣市／附近地圖的 zoom 感知標記：z9–12 網格聚合，z13+ 單點針。
 * 全國縣市 aggregate 已退役；全國層入口是縣市磚牆。
 */
import type { Playground } from "@/data/playgrounds";

export type SpatialCluster = {
  id: string;
  count: number;
  lat: number;
  lng: number;
  places: readonly Playground[];
};

/**
 * 以台灣全台 overview 的現有 fit 行為為基準：
 * - 9–12 級以區域網格聚合
 * - 13 級以上讓單點針接手
 *
 * DEFAULT_ZOOM 是 11，既有 FitBounds 的 maxZoom 是 14；這組邊界讓
 * 縣市／附近地圖放大到區域後才逐步拆解，不依賴外部套件。
 */
export const INDIVIDUAL_MARKER_MIN_ZOOM = 13;

export type PlayMapMarkerMode = "spatial" | "individual";

export function playMapMarkerMode(zoom: number): PlayMapMarkerMode {
  if (zoom < INDIVIDUAL_MARKER_MIN_ZOOM) return "spatial";
  return "individual";
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
