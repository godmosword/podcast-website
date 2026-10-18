/**
 * 親子遊樂地圖「在哪裡玩？」的縣市分組資料層。
 *
 * 取代原本的縣市色塊圖：家長本來就用北中南想事情，文字＋數量就是最直接的編碼，
 * 不需要色深階梯，也不需要「示意排列，非實際地理位置」那句免責字。
 *
 * 未收錄縣市**不做成按鈕**，改由 `uncataloguedNotice` 在選擇器下方用一行可見文字
 * 說明——沒收錄不代表當地沒地方玩，這句話不能只放進 aria-label。
 */
import { CITY_DISPLAY_ORDER, listCities } from "@/data/playgrounds";

export type PlayMapRegionKey = "north" | "central" | "south" | "east";

type RegionDefinition = {
  key: PlayMapRegionKey;
  label: string;
  cities: readonly string[];
};

/**
 * 22 縣市的區域歸屬。縣市名稱必須與 CITY_DISPLAY_ORDER 完全一致（有測試把關），
 * 組內順序沿用 CITY_DISPLAY_ORDER（北到南）。
 */
export const PLAY_MAP_REGIONS: readonly RegionDefinition[] = [
  {
    key: "north",
    label: "北部",
    cities: ["基隆市", "台北市", "新北市", "桃園市", "新竹市", "新竹縣", "宜蘭縣"],
  },
  {
    key: "central",
    label: "中部",
    cities: ["苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣"],
  },
  {
    key: "south",
    label: "南部",
    cities: ["嘉義市", "嘉義縣", "台南市", "高雄市", "屏東縣"],
  },
  {
    key: "east",
    label: "東部與離島",
    cities: ["花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣"],
  },
];

/**
 * `covered`＝目前條件下有命中；`empty`＝已收錄但這組條件 0 筆（仍可點）。
 * 「整個縣市尚未收錄」不是按鈕狀態，見 `listUncataloguedCities`。
 */
export type PlayMapRegionCityStatus = "covered" | "empty";

export type PlayMapRegionCity = {
  city: string;
  count: number;
  status: PlayMapRegionCityStatus;
  /** 「桃園市，10 個地點」——e2e 以此查詢，格式不得任意更動。 */
  ariaLabel: string;
};

export type PlayMapRegion = {
  key: PlayMapRegionKey;
  label: string;
  cities: readonly PlayMapRegionCity[];
};

function byDisplayOrder(a: string, b: string): number {
  return CITY_DISPLAY_ORDER.indexOf(a) - CITY_DISPLAY_ORDER.indexOf(b);
}

/**
 * 只輸出已收錄縣市；一個已收錄縣市都沒有的區域整組略過（例如目前的東部與離島）。
 */
export function buildPlayMapRegions(args: {
  /** 來自 usePlayMapFilters 的 cityCounts：已套用其他篩選、未套用 city 本身。 */
  counts: ReadonlyMap<string, number>;
  /** 已收錄縣市；預設取資料裡實際出現過的縣市。 */
  coveredCities?: readonly string[];
}): readonly PlayMapRegion[] {
  const covered = new Set(args.coveredCities ?? listCities());

  return PLAY_MAP_REGIONS.map((region) => ({
    key: region.key,
    label: region.label,
    cities: [...region.cities]
      .filter((city) => covered.has(city))
      .sort(byDisplayOrder)
      .map((city): PlayMapRegionCity => {
        const count = args.counts.get(city) ?? 0;
        return {
          city,
          count,
          status: count > 0 ? "covered" : "empty",
          ariaLabel: `${city}，${count} 個地點`,
        };
      }),
  })).filter((region) => region.cities.length > 0);
}

/** 區域表減去已收錄縣市；依北到南排序。 */
export function listUncataloguedCities(
  coveredCities?: readonly string[],
): readonly string[] {
  const covered = new Set(coveredCities ?? listCities());
  return PLAY_MAP_REGIONS.flatMap((region) => region.cities)
    .filter((city) => !covered.has(city))
    .sort(byDisplayOrder);
}

/** 缺哪些縣市要講清楚，並且明說「沒收錄 ≠ 當地沒地方玩」。 */
export function uncataloguedNotice(cities: readonly string[]): string {
  if (cities.length === 0) return "";
  const ordered = [...cities].sort(byDisplayOrder);
  return `尚未收錄：${ordered.join("、")}。不代表當地沒有好去處。`;
}
