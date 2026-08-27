/**
 * 親子遊樂地圖查詢 resolver。
 * city 省略／null 表示全部已收錄縣市（供意圖優先首屏與統計）。
 */
import {
  listCities,
  listPlaygrounds,
  PLAYGROUND_TYPES,
  type Playground,
  type PlaygroundType,
} from "@/data/playgrounds";
import {
  isEasyParking,
  isHighEnergy,
  isOutdoorPlace,
  isRainyDayFriendly,
  isStrollerFriendly,
} from "@/lib/playground-context";

export type PlaygroundFilter = {
  city?: string;
  indoorOnly?: boolean;
  outdoorOnly?: boolean;
  freeOnly?: boolean;
  rainyDayOnly?: boolean;
  parkingOnly?: boolean;
  strollerFriendlyOnly?: boolean;
  highEnergyOnly?: boolean;
  type?: PlaygroundType;
  bounds?: PlaygroundBounds;
};

/** Leaflet live/committed viewport 的 serializable geographic snapshot。 */
export type PlaygroundBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export function isPlaygroundWithinBounds(
  place: Playground,
  bounds: PlaygroundBounds,
): boolean {
  const withinLatitude = place.lat >= bounds.south && place.lat <= bounds.north;
  if (!withinLatitude) return false;
  if (bounds.west <= bounds.east) {
    return place.lng >= bounds.west && place.lng <= bounds.east;
  }
  // 台灣目前不會跨 antimeridian，但保留這個分支讓 predicate 完整。
  return place.lng >= bounds.west || place.lng <= bounds.east;
}

export type CoverageSummary = {
  city: string;
  count: number;
};

export function filterPlaygrounds(filter: PlaygroundFilter = {}): Playground[] {
  const {
    city,
    indoorOnly,
    outdoorOnly,
    freeOnly,
    rainyDayOnly,
    parkingOnly,
    strollerFriendlyOnly,
    highEnergyOnly,
    type,
    bounds,
  } = filter;
  return listPlaygrounds().filter((place) => {
    if (city !== undefined && place.city !== city) return false;
    if (indoorOnly && !place.indoor) return false;
    if (outdoorOnly && !isOutdoorPlace(place)) return false;
    if (freeOnly && !place.free) return false;
    if (rainyDayOnly && !isRainyDayFriendly(place)) return false;
    if (parkingOnly && !isEasyParking(place)) return false;
    if (strollerFriendlyOnly && !isStrollerFriendly(place)) return false;
    if (highEnergyOnly && !isHighEnergy(place)) return false;
    if (type !== undefined && place.type !== type) return false;
    if (bounds && !isPlaygroundWithinBounds(place, bounds)) return false;
    return true;
  });
}

/**
 * 在既有條件（縣市／室內／免費）下，各 type 還剩幾筆。
 * 供類型 chip 顯示數量；0 筆選項由 UI 隱藏。
 */
export function countByType(
  filter: Omit<PlaygroundFilter, "type"> = {},
): Map<PlaygroundType, number> {
  const counts = new Map<PlaygroundType, number>();
  for (const place of filterPlaygrounds(filter)) {
    counts.set(place.type, (counts.get(place.type) ?? 0) + 1);
  }
  return counts;
}

/**
 * 在既有條件（類型／室內／免費）下，各縣市還剩幾筆。
 * 與 countByType 同語意——兩排 chip 的「· N」必須都是「剩餘數」。
 */
export function countByCity(
  filter: Omit<PlaygroundFilter, "city"> = {},
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const place of filterPlaygrounds(filter)) {
    counts.set(place.city, (counts.get(place.city) ?? 0) + 1);
  }
  return counts;
}

export type PlayMapView = "cards" | "map";

/** 可分享／可加書籤的 play-map 檢視狀態（server 與 client 共用同一組解析）。 */
export type PlayMapQuery = {
  /** null = 全部已收錄；URL 省略 city。 */
  city: string | null;
  type: PlaygroundType | null;
  indoorOnly: boolean;
  outdoorOnly: boolean;
  freeOnly: boolean;
  rainyDayOnly: boolean;
  parkingOnly: boolean;
  strollerFriendlyOnly: boolean;
  highEnergyOnly: boolean;
  view: PlayMapView;
};

export type RawPlayMapParams = {
  city?: string | string[];
  type?: string | string[];
  indoor?: string | string[];
  outdoor?: string | string[];
  free?: string | string[];
  rain?: string | string[];
  parking?: string | string[];
  stroller?: string | string[];
  energy?: string | string[];
  view?: string | string[];
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * 把網址參數收斂成合法狀態；無法識別的值退回安全預設。
 * 無／非法 city → null（全部），不再預設鎖台北市。
 */
export function parsePlayMapQuery(params: RawPlayMapParams): PlayMapQuery {
  const rawCity = first(params.city);
  const rawType = first(params.type);
  const city =
    rawCity !== undefined && listCities().includes(rawCity) ? rawCity : null;
  const rawView = first(params.view) === "map" ? "map" : "cards";
  // 無縣市的 view=map 不再是全國地圖入口；解析成 cards，避免首屏閃地圖。
  const view = rawView === "map" && city === null ? "cards" : rawView;

  return {
    city,
    type:
      rawType !== undefined &&
      (PLAYGROUND_TYPES as readonly string[]).includes(rawType)
        ? (rawType as PlaygroundType)
        : null,
    indoorOnly: first(params.indoor) === "1",
    outdoorOnly: first(params.outdoor) === "1",
    freeOnly: first(params.free) === "1",
    rainyDayOnly: first(params.rain) === "1",
    parkingOnly: first(params.parking) === "1",
    strollerFriendlyOnly: first(params.stroller) === "1",
    highEnergyOnly: first(params.energy) === "1",
    view,
  };
}

/** 反向：把狀態寫回 query string；等於預設值的 key 一律省略。 */
export function buildPlayMapQueryString(query: PlayMapQuery): string {
  const params = new URLSearchParams();
  if (query.city) params.set("city", query.city);
  if (query.type) params.set("type", query.type);
  if (query.indoorOnly) params.set("indoor", "1");
  if (query.outdoorOnly) params.set("outdoor", "1");
  if (query.freeOnly) params.set("free", "1");
  if (query.rainyDayOnly) params.set("rain", "1");
  if (query.parkingOnly) params.set("parking", "1");
  if (query.strollerFriendlyOnly) params.set("stroller", "1");
  if (query.highEnergyOnly) params.set("energy", "1");
  if (query.view === "map") params.set("view", "map");
  return params.toString();
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
