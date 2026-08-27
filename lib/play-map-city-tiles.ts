/**
 * 親子遊樂地圖的縣市色塊圖資料層。
 *
 * 這裡刻意**不用 GeoJSON、不畫精確縣市界**：磚位是手排的近似排列，
 * 目的是讓家長一眼看出「北中南哪裡有東西玩」，不是提供地理正確性。
 * 因此消費端必須顯示可見的「示意排列，非實際地理位置」聲明。
 */
import { CITY_DISPLAY_ORDER, listCities } from "@/data/playgrounds";

/**
 * 磚牆欄數。四欄語意（1 西岸／離島、2 西部、3 中線、4 東部）適用 row1–4 與 row6。
 * row5 的 col4（嘉義縣）是為了填滿該列、不表示東部；row7 是離島列，不套用欄語意。
 * 近似值，非精確經度。不要為了「對齊欄語意」去挪磚——空格只能落在列的邊緣。
 */
export const CITY_WALL_COLUMNS = 4;
export const CITY_WALL_ROWS = 7;

export type CityTileSlot = {
  city: string;
  row: number;
  col: number;
};

/**
 * 22 縣市的固定磚位。row/col 不得重複（有測試把關）。
 * 縣市名稱必須與 CITY_DISPLAY_ORDER 完全一致，否則磚牆會漏縣市。
 *
 * 空格只能落在每一列的**邊緣**。夾在兩塊磚中間的洞會被讀成「少了一塊磚」
 * 而不是「這裡沒有陸地」——宜蘭縣放 col3 而非 col4 就是為了填掉這種洞
 * （而且宜蘭本來就與新北接壤，放 col3 反而更接近實際）。
 */
export const CITY_WALL_SLOTS: readonly CityTileSlot[] = [
  { city: "台北市", row: 1, col: 2 },
  { city: "基隆市", row: 1, col: 3 },
  { city: "新北市", row: 2, col: 2 },
  { city: "宜蘭縣", row: 2, col: 3 },
  { city: "桃園市", row: 3, col: 1 },
  { city: "新竹市", row: 3, col: 2 },
  { city: "新竹縣", row: 3, col: 3 },
  { city: "苗栗縣", row: 4, col: 1 },
  { city: "台中市", row: 4, col: 2 },
  { city: "南投縣", row: 4, col: 3 },
  { city: "花蓮縣", row: 4, col: 4 },
  { city: "彰化縣", row: 5, col: 1 },
  { city: "雲林縣", row: 5, col: 2 },
  { city: "嘉義市", row: 5, col: 3 },
  { city: "嘉義縣", row: 5, col: 4 },
  { city: "台南市", row: 6, col: 1 },
  { city: "高雄市", row: 6, col: 2 },
  { city: "屏東縣", row: 6, col: 3 },
  { city: "台東縣", row: 6, col: 4 },
  { city: "澎湖縣", row: 7, col: 1 },
  { city: "金門縣", row: 7, col: 2 },
  { city: "連江縣", row: 7, col: 3 },
];

/**
 * `covered`＝目前條件下有命中；`empty`＝已收錄但這組條件 0 筆；
 * `uncatalogued`＝整個縣市尚未收錄資料。後兩者對家長的意義完全不同，
 * 混成同一種灰色會讓人以為當地沒地方玩。
 */
export type PlayMapCityTileStatus = "covered" | "empty" | "uncatalogued";

export type PlayMapCityTile = {
  city: string;
  row: number;
  col: number;
  count: number;
  status: PlayMapCityTileStatus;
  /** 0–4 色深階。**不得是唯一編碼**，count 必須同時以文字呈現。 */
  density: 0 | 1 | 2 | 3 | 4;
  /** 「桃園市，10 個地點」／「宜蘭縣，尚未收錄」 */
  ariaLabel: string;
  /** 磚上第二行可見文字。 */
  statusLabel: string;
};

const DENSITY_STEPS: readonly (0 | 1 | 2 | 3 | 4)[] = [1, 2, 3, 4];

/** count 佔全體最大值的比例分四階；0 筆恆為 0 階。 */
export function cityTileDensity(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const ratio = Math.min(1, count / max);
  const index = Math.min(
    DENSITY_STEPS.length - 1,
    Math.max(0, Math.ceil(ratio * DENSITY_STEPS.length) - 1),
  );
  return DENSITY_STEPS[index]!;
}

export function buildPlayMapCityTiles(args: {
  /** 來自 usePlayMapFilters 的 cityCounts：已套用其他篩選、未套用 city 本身。 */
  counts: ReadonlyMap<string, number>;
  /** 已收錄縣市；預設取資料裡實際出現過的縣市。 */
  coveredCities?: readonly string[];
}): readonly PlayMapCityTile[] {
  const covered = new Set(args.coveredCities ?? listCities());
  const max = Math.max(
    0,
    ...CITY_WALL_SLOTS.map((slot) => args.counts.get(slot.city) ?? 0),
  );

  return CITY_WALL_SLOTS.map((slot) => {
    const isCovered = covered.has(slot.city);
    const count = isCovered ? (args.counts.get(slot.city) ?? 0) : 0;
    const status: PlayMapCityTileStatus = !isCovered
      ? "uncatalogued"
      : count > 0
        ? "covered"
        : "empty";

    return {
      city: slot.city,
      row: slot.row,
      col: slot.col,
      count,
      status,
      density: status === "covered" ? cityTileDensity(count, max) : 0,
      ariaLabel:
        status === "uncatalogued"
          ? `${slot.city}，尚未收錄`
          : `${slot.city}，${count} 個地點`,
      statusLabel: status === "uncatalogued" ? "未收錄" : `${count} 個`,
    };
  });
}

/** 磚位表減去已收錄縣市；供磚牆下方的誠實聲明使用。依北到南排序。 */
export function listUncataloguedCities(
  coveredCities?: readonly string[],
): readonly string[] {
  const covered = new Set(coveredCities ?? listCities());
  return CITY_WALL_SLOTS.map((slot) => slot.city)
    .filter((city) => !covered.has(city))
    .sort(
      (a, b) => CITY_DISPLAY_ORDER.indexOf(a) - CITY_DISPLAY_ORDER.indexOf(b),
    );
}

/** 缺哪些縣市要講清楚，並且明說「沒收錄 ≠ 當地沒地方玩」。 */
export function uncataloguedNotice(cities: readonly string[]): string {
  if (cities.length === 0) return "";
  const ordered = [...cities].sort(
    (a, b) => CITY_DISPLAY_ORDER.indexOf(a) - CITY_DISPLAY_ORDER.indexOf(b),
  );
  return `${ordered.join("、")}尚未收錄，不代表當地沒有好去處。`;
}
