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
  freeOnly: boolean;
  view: PlayMapView;
};

export type RawPlayMapParams = {
  city?: string | string[];
  type?: string | string[];
  indoor?: string | string[];
  free?: string | string[];
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
  const view = first(params.view) === "map" ? "map" : "cards";

  return {
    city:
      rawCity !== undefined && listCities().includes(rawCity) ? rawCity : null,
    type:
      rawType !== undefined &&
      (PLAYGROUND_TYPES as readonly string[]).includes(rawType)
        ? (rawType as PlaygroundType)
        : null,
    indoorOnly: first(params.indoor) === "1",
    freeOnly: first(params.free) === "1",
    view,
  };
}

/** 反向：把狀態寫回 query string；等於預設值的 key 一律省略。 */
export function buildPlayMapQueryString(query: PlayMapQuery): string {
  const params = new URLSearchParams();
  if (query.city) params.set("city", query.city);
  if (query.type) params.set("type", query.type);
  if (query.indoorOnly) params.set("indoor", "1");
  if (query.freeOnly) params.set("free", "1");
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
