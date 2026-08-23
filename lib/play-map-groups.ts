/**
 * 親子遊樂地圖名單的分組策略。
 *
 * 平面 99 張卡片對家長沒有結構；分組把「有多遠／在哪個縣市／是哪一類」
 * 提到標題層，讓人先挑一段再挑一個。分組本身不改變排序，只是切段。
 */
import {
  CITY_DISPLAY_ORDER,
  PLAYGROUND_TYPES,
  type Playground,
} from "@/data/playgrounds";
import {
  estimateDriveMinutes,
  haversineKm,
  type LatLng,
} from "@/lib/playground-distance";

export type PlayMapGroupMode = "drive" | "city" | "type";

export const DRIVE_BANDS = [
  { key: "d20", maxMinutes: 20, label: "20 分鐘內" },
  { key: "d40", maxMinutes: 40, label: "20–40 分鐘" },
  { key: "d60", maxMinutes: 60, label: "40–60 分鐘" },
  { key: "d61", maxMinutes: Number.POSITIVE_INFINITY, label: "60 分鐘以上" },
] as const;

/**
 * 車程是「直線距離 × 2.8 分/km」的市區粗估。過去它只出現在單張卡片，
 * 讀者自然會打折；一旦升格成分組標題就會被拿去排行程，所以免責必填，
 * 而且渲染在第一組標題之上，不是頁尾小字。
 */
export const DRIVE_GROUP_NOTE = "車程為直線距離粗估，不含即時路況與停車時間。";

export type PlayMapGroupItem = {
  place: Playground;
  /** 跨組連續編號；批次遮蔽（VISIBLE_STEP）的唯一真相。 */
  displayIndex: number;
};

export type PlayMapResultGroup = {
  key: string;
  label: string;
  /** 該組總數，**不受 visibleCount 影響**。 */
  count: number;
  /** 「20 分鐘內 · 4 個」 */
  headline: string;
  items: readonly PlayMapGroupItem[];
};

export function resolvePlayMapGroupMode(args: {
  hasLocation: boolean;
  city: string | null;
}): PlayMapGroupMode {
  if (args.hasLocation) return "drive";
  if (args.city === null) return "city";
  return "type";
}

function driveBandKey(place: Playground, user: LatLng): string {
  const minutes = estimateDriveMinutes(
    haversineKm(user, { lat: place.lat, lng: place.lng }),
  );
  const band = DRIVE_BANDS.find((item) => minutes <= item.maxMinutes);
  return (band ?? DRIVE_BANDS[DRIVE_BANDS.length - 1]!).key;
}

type GroupPlan = {
  /** 分組鍵的顯示順序；不在此清單內的鍵退到最後，依首次出現排序。 */
  order: readonly string[];
  labelOf: (key: string) => string;
  keyOf: (place: Playground) => string;
};

function planFor(
  mode: PlayMapGroupMode,
  userLatLng: LatLng | null,
  cityOrder: readonly string[],
): GroupPlan {
  if (mode === "drive" && userLatLng) {
    const labels = new Map(DRIVE_BANDS.map((b) => [b.key as string, b.label]));
    return {
      order: DRIVE_BANDS.map((b) => b.key),
      labelOf: (key) => labels.get(key) ?? key,
      keyOf: (place) => driveBandKey(place, userLatLng),
    };
  }
  // 沒有定位就沒有車程可算，退回縣市分組而不是硬給一個假的距離帶。
  if (mode === "type") {
    return {
      order: PLAYGROUND_TYPES,
      labelOf: (key) => key,
      keyOf: (place) => place.type,
    };
  }
  return {
    order: cityOrder,
    labelOf: (key) => key,
    keyOf: (place) => place.city,
  };
}

export function groupPlayMapResults(args: {
  /** 已排序的命中結果；分組不重排，只切段。 */
  places: readonly Playground[];
  mode: PlayMapGroupMode;
  userLatLng: LatLng | null;
  cityOrder?: readonly string[];
}): readonly PlayMapResultGroup[] {
  const plan = planFor(
    args.mode,
    args.userLatLng,
    args.cityOrder ?? CITY_DISPLAY_ORDER,
  );

  const buckets = new Map<string, Playground[]>();
  const firstSeen: string[] = [];
  for (const place of args.places) {
    const key = plan.keyOf(place);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(place);
    } else {
      buckets.set(key, [place]);
      firstSeen.push(key);
    }
  }

  const ordered = [
    ...plan.order.filter((key) => buckets.has(key)),
    ...firstSeen.filter((key) => !plan.order.includes(key)),
  ];

  let displayIndex = 0;
  return ordered.map((key) => {
    const places = buckets.get(key)!;
    const items = places.map((place) => ({
      place,
      displayIndex: displayIndex++,
    }));
    const label = plan.labelOf(key);
    return {
      key,
      label,
      count: items.length,
      headline: `${label} · ${items.length} 個`,
      items,
    };
  });
}
