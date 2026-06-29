import type { ZoneId } from "@/data/universe-zones";

/**
 * car-park 島內步道（tile 264×260 本地座標）。
 *
 * 環狀路線：前緣草地起步 → 後段繞到摩天輪後方（觸發深度遮擋，見 `ZONE_OCCLUDERS`）
 * → 右側折返 → 回前緣。閉合 `Z`，roamer 連續繞圈，每圈鑽過摩天輪後方一次。
 */
export const CAR_PARK_WALKWAY_PATH =
  "M 72 196 C 56 150 92 110 130 104 C 158 100 184 132 188 172 C 188 202 116 212 72 196 Z";

export type RoamerRoute = {
  id: string;
  kind: "island";
  zoneId: ZoneId;
  /** SVG path，tile 本地座標（0..stageSize） */
  tilePath: string;
  /** true=到底回頭；預設 false=循環回起點 */
  pingpong?: boolean;
};

/** 4 向 sprite：front/rear 兩張面朝畫面左的視圖，左右用 scaleX 鏡像 → 4 個朝向。 */
export type RoamerDir = "front" | "rear";

export type RoamerSprites = {
  /** ¾ 前視（面朝畫面左、車頭朝向觀者）。 */
  front: string;
  /** ¾ 後視（面朝畫面左、車尾朝向觀者）。未到位時 rear 回退 front。 */
  rear?: string;
  frontNight?: string;
  rearNight?: string;
};

export type Roamer = {
  id: string;
  characterId: string;
  zoneId: ZoneId;
  routeId: string;
  /** tile 本地 px/s（path 長度比例） */
  speed: number;
  /** 多方向 sprite（4 向＝front/rear × 左右鏡像）。未設則由 src 衍生（向後相容）。 */
  sprites?: RoamerSprites;
  /** 單張 fallback（舊資料／rear 未到位時的 front 來源）。 */
  src: string;
  srcNight?: string;
  enabled?: boolean;
  startOffset?: number;
};

export const ROAMER_ROUTES: RoamerRoute[] = [
  {
    id: "car-park-walkway",
    kind: "island",
    zoneId: "car-park",
    tilePath: CAR_PARK_WALKWAY_PATH,
  },
];

export const MAP_ROAMERS: Roamer[] = [
  {
    id: "roam-xiaohong",
    characterId: "xiao-hong",
    zoneId: "car-park",
    routeId: "car-park-walkway",
    speed: 28,
    src: "/adventures/roamers/xiao-hong.png",
    enabled: true,
    startOffset: 0,
  },
  {
    id: "roam-duoduo",
    characterId: "duo-duo",
    zoneId: "car-park",
    routeId: "car-park-walkway",
    speed: 24,
    src: "/adventures/roamers/duo-duo.png",
    enabled: true,
    startOffset: 0.5,
  },
];

/** 整島地標的深度遮擋設定（單張 tile 用同圖 clip-path 複製疊在 roamer 上方）。 */
export type ZoneOccluder = {
  /**
   * CSS `clip-path`（tile box 百分比）：露出地標剪影區、其餘透明。
   * 與 base tile 像素 1:1 對齊，無接縫。
   */
  clipPath: string;
  /**
   * 地標接地基線（tile 本地 y px）。roamer groundY < baselineY → 判定在地標後方，
   * z-index 落到遮擋層下方而被剪影擋住；> baselineY → 浮在遮擋層上方（在前方，正常顯示）。
   */
  baselineY: number;
};

/** 各島地標遮擋（目前僅 car-park 摩天輪）。未列出的島不做遮擋。 */
export const ZONE_OCCLUDERS: Partial<Record<ZoneId, ZoneOccluder>> = {
  "car-park": { clipPath: "ellipse(20% 27% at 52% 26%)", baselineY: 134 },
};

/** 取得 roamer 的 sprite 集（未設 sprites 時由單張 src 衍生）。 */
export function resolveRoamerSprites(roamer: Roamer): RoamerSprites {
  if (roamer.sprites) return roamer.sprites;
  return { front: roamer.src, frontNight: roamer.srcNight };
}

/** 依朝向＋日夜解析實際 sprite 來源（rear 未到位時回退 front）。 */
export function roamerSpriteSrc(
  roamer: Roamer,
  dir: RoamerDir,
  night: boolean,
): string {
  const sprites = resolveRoamerSprites(roamer);
  if (dir === "rear" && sprites.rear) {
    return night && sprites.rearNight ? sprites.rearNight : sprites.rear;
  }
  return night && sprites.frontNight ? sprites.frontNight : sprites.front;
}

/** 是否備有獨立 rear 視圖（決定是否渲染第二張 sprite）。 */
export function roamerHasRear(roamer: Roamer): boolean {
  return Boolean(resolveRoamerSprites(roamer).rear);
}

export function shouldRenderRoamer(roamer: Roamer, devRoamers: boolean): boolean {
  if (roamer.enabled) return true;
  if (devRoamers && process.env.NODE_ENV !== "production") return true;
  return false;
}

export function isDevRoamersQuery(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("devRoamers") === "1";
}
