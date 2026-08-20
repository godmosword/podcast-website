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
export const TAIWAN_NATIONAL_TARGET_WEST = 120.35;

export const TAIWAN_NATIONAL_LAT = 23.75;

/** 地圖寬度未知時的後備中心（用中等寬度估，略偏東）。 */
export const TAIWAN_MAP_CENTER: [number, number] = [23.75, 121.89];

/** 全國預設縮放：再放大就交給縣市／附近鏡頭。 */
export const TAIWAN_NATIONAL_MAX_ZOOM = 8;

/** 全國／探索下限：再縮小會把華東放進主畫面。 */
export const TAIWAN_SOFT_MIN_ZOOM = 7;

export const TAIWAN_MAX_BOUNDS_VISCOSITY = 0.35;

const WEB_MERCATOR_TILE_PX = 256;
const FALLBACK_MAP_WIDTH_PX = 560;
const FALLBACK_MAP_HEIGHT_PX = 520;

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
 *
 * 這支只看寬度、不看資料，會在資料往西／往南長時裁掉縣市。
 * 正式鏡頭請用 `nationalViewForClusters`；這裡保留作為沒有 cluster 可框
 * （空集合、尺寸不明）時的後備。
 */
export function taiwanNationalView(mapWidthPx: number): {
  center: [number, number];
  zoom: number;
} {
  const zoom = TAIWAN_NATIONAL_MAX_ZOOM;
  const width =
    Number.isFinite(mapWidthPx) && mapWidthPx >= 80
      ? mapWidthPx
      : FALLBACK_MAP_WIDTH_PX;
  const halfLng = (width / 2) * lngDegreesPerPixel(zoom);
  return {
    center: [TAIWAN_NATIONAL_LAT, TAIWAN_NATIONAL_TARGET_WEST + halfLng],
    zoom,
  };
}

/**
 * cluster marker 的視覺足跡（相對於錨點的內縮邊距，單位 px）。
 *
 * 圓形本體 44px、`iconAnchor` 在正中心，所以左右各 22px；但城市名標籤
 * （`.playMapMarkerName`）浮在圓的正上方且可寬達 160px，上緣要留的比下緣多。
 * 只算 44px 會讓最北與最西的縣市標籤被裁掉——這正是修這支函式的起因。
 */
export const NATIONAL_MARKER_INSET = {
  left: 30,
  right: 30,
  top: 52,
  bottom: 26,
} as const;

export type NationalViewPoint = { lat: number; lng: number };

export type NationalView = { center: [number, number]; zoom: number };

function mercatorX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * WEB_MERCATOR_TILE_PX * 2 ** zoom;
}

function mercatorY(lat: number, zoom: number): number {
  const clamped = Math.max(-85.05, Math.min(85.05, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  const ratio = 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI);
  return ratio * WEB_MERCATOR_TILE_PX * 2 ** zoom;
}

function lngAtX(x: number, zoom: number): number {
  return (x / (WEB_MERCATOR_TILE_PX * 2 ** zoom)) * 360 - 180;
}

function latAtY(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (WEB_MERCATOR_TILE_PX * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function usableSize(px: number, fallback: number): number {
  return Number.isFinite(px) && px >= 80 ? px : fallback;
}

/**
 * 全國鏡頭：框住實際的縣市聚合點，而不是猜一組常數。
 *
 * 舊版把西緣硬釘在 `TAIWAN_NATIONAL_TARGET_WEST`（120.35），那是資料只收到
 * 雲林（120.48）時訂的。南部進資料後，台南（120.28）與高雄（120.32）的質心
 * 落在那條線以西，整顆 marker 被推出畫面——行動版等於有兩個縣市點不到。
 * 常數會隨資料腐壞，所以改成從 points 推導，只保留「不把福建當主畫面」這個
 * **下限**，而不是拿它當唯一答案。
 *
 * 兩條 clamp 衝突時（資料比 119.95 還西，例如未來收澎湖）以**資料可見性優先**：
 * 看不到的縣市是功能損壞，多露一點海峽只是畫面取捨。
 */
export function nationalViewForClusters(args: {
  widthPx: number;
  heightPx: number;
  points: readonly NationalViewPoint[];
}): NationalView {
  const width = usableSize(args.widthPx, FALLBACK_MAP_WIDTH_PX);
  const height = usableSize(args.heightPx, FALLBACK_MAP_HEIGHT_PX);
  if (args.points.length === 0) return taiwanNationalView(args.widthPx);

  const inset = NATIONAL_MARKER_INSET;
  for (
    let zoom = TAIWAN_NATIONAL_MAX_ZOOM;
    zoom >= TAIWAN_SOFT_MIN_ZOOM;
    zoom--
  ) {
    const xs = args.points.map((point) => mercatorX(point.lng, zoom));
    const ys = args.points.map((point) => mercatorY(point.lat, zoom));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const slackX = width - inset.left - inset.right - (maxX - minX);
    const slackY = height - inset.top - inset.bottom - (maxY - minY);
    // 放不下就降一級。全部看得到但擠，勝過乾淨但裁掉幾個縣市。
    if ((slackX < 0 || slackY < 0) && zoom > TAIWAN_SOFT_MIN_ZOOM) continue;

    const centerY = minY - (inset.top + Math.max(0, slackY) / 2) + height / 2;
    const centered = minX - (inset.left + Math.max(0, slackX) / 2) + width / 2;
    const keepWestBound = mercatorX(TAIWAN_MAP_BOUNDS.west, zoom) + width / 2;
    const keepDataVisible = minX - inset.left + width / 2;
    const centerX = Math.min(
      Math.max(centered, keepWestBound),
      keepDataVisible,
    );

    return { center: [latAtY(centerY, zoom), lngAtX(centerX, zoom)], zoom };
  }

  return taiwanNationalView(args.widthPx);
}

export function taiwanNationalWestEdge(mapWidthPx: number): number {
  const view = taiwanNationalView(mapWidthPx);
  const width =
    Number.isFinite(mapWidthPx) && mapWidthPx >= 80
      ? mapWidthPx
      : FALLBACK_MAP_WIDTH_PX;
  const halfLng = (width / 2) * lngDegreesPerPixel(view.zoom);
  return view.center[1] - halfLng;
}
