/**
 * 親子遊樂地圖鏡頭契約：台灣為主體，不當成中國地圖的一角。
 *
 * 這是相機／framing 問題，不改 OSM 圖磚、也不隱藏真實地名。
 * 全國 cluster 地圖已退役；這裡只保留軟邊界與縮放下限，避免縣市／附近
 * 地圖被縮到把華東放進主畫面。
 */

export const TAIWAN_MAP_BOUNDS = {
  south: 21.9,
  west: 119.95,
  north: 25.35,
  east: 122.05,
} as const;

/** 可平移的軟邊界：允許看海峽與太平洋，但不把華東當探索範圍。 */
export const TAIWAN_MAX_BOUNDS = {
  south: 21.5,
  west: 119.85,
  north: 25.7,
  east: 122.6,
} as const;

/** 地圖寬度未知時的後備中心（用中等寬度估，略偏東）。 */
export const TAIWAN_MAP_CENTER: [number, number] = [23.75, 121.89];

/** MapContainer 初始縮放；縣市／附近鏡頭仍由 fitBounds 接手。 */
export const TAIWAN_NATIONAL_MAX_ZOOM = 8;

/** 探索下限：再縮小會把華東放進主畫面。本輪不改此值。 */
export const TAIWAN_SOFT_MIN_ZOOM = 7;

export const TAIWAN_MAX_BOUNDS_VISCOSITY = 0.35;

export type PlayMapCameraBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export function taiwanMapBoundsCorners(
  bounds: PlayMapCameraBounds = TAIWAN_MAP_BOUNDS,
): [[number, number], [number, number]] {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
}

/** 鏡頭西緣不得把福建內陸當主體。 */
export function isTaiwanFocusedWest(west: number): boolean {
  return west >= TAIWAN_MAP_BOUNDS.west - 0.15;
}
