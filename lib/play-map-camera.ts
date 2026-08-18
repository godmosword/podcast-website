/**
 * 親子遊樂地圖鏡頭契約：台灣為主體，不當成中國地圖的一角。
 *
 * 這是相機／framing 問題，不改 OSM 圖磚、也不隱藏真實地名。
 * 全國未縮小範圍時用固定縮放＋依地圖寬度東移中心：窄螢幕框住本島，
 * 寬螢幕把多出來的經度給太平洋，避免 fitBounds 為了南北向把福建拉進主畫面。
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

/** 全國鏡頭要守住的西緣：海峽東側，不把福州／平潭當主畫面。 */
export const TAIWAN_NATIONAL_TARGET_WEST = 120.05;

export const TAIWAN_NATIONAL_LAT = 23.75;

/** 地圖寬度未知時的後備中心（略偏東）。 */
export const TAIWAN_MAP_CENTER: [number, number] = [23.75, 121.55];

/** 全國預設縮放：再放大就交給縣市／附近鏡頭。 */
export const TAIWAN_NATIONAL_MAX_ZOOM = 8;

/** 全國／探索下限：再縮小會把華東放進主畫面。 */
export const TAIWAN_SOFT_MIN_ZOOM = 7;

export const TAIWAN_MAX_BOUNDS_VISCOSITY = 0.35;

const WEB_MERCATOR_TILE_PX = 256;

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

/** 全國鏡頭不得把視窗西緣拉到福建內陸。 */
export function isTaiwanFocusedWest(west: number): boolean {
  return west >= TAIWAN_MAP_BOUNDS.west - 0.15;
}

function lngDegreesPerPixel(zoom: number): number {
  return 360 / (WEB_MERCATOR_TILE_PX * 2 ** zoom);
}

/**
 * 依地圖容器寬度算出全國 setView。經度在 Web Mercator 是線性的，
 * 把西緣釘在海峽東側，寬圖多出的像素自然落在太平洋。
 */
export function taiwanNationalView(mapWidthPx: number): {
  center: [number, number];
  zoom: number;
} {
  const zoom = TAIWAN_NATIONAL_MAX_ZOOM;
  if (!Number.isFinite(mapWidthPx) || mapWidthPx < 80) {
    return { center: TAIWAN_MAP_CENTER, zoom };
  }
  const halfLng = (mapWidthPx / 2) * lngDegreesPerPixel(zoom);
  return {
    center: [TAIWAN_NATIONAL_LAT, TAIWAN_NATIONAL_TARGET_WEST + halfLng],
    zoom,
  };
}

export function taiwanNationalWestEdge(mapWidthPx: number): number {
  const view = taiwanNationalView(mapWidthPx);
  if (!Number.isFinite(mapWidthPx) || mapWidthPx < 80) {
    return TAIWAN_NATIONAL_TARGET_WEST;
  }
  const halfLng = (mapWidthPx / 2) * lngDegreesPerPixel(view.zoom);
  return view.center[1] - halfLng;
}
