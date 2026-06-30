import type { ZoneId } from "@/data/universe-zones";
import { resolveUniverseMap } from "@/lib/universe-map";

/**
 * car-park 島內步道（tile 264×260 本地座標）。
 *
 * 環狀路線：前緣草地起步 → 後段繞到摩天輪後方（觸發深度遮擋，見 `ZONE_OCCLUDERS`）
 * → 右側折返 → 回前緣。閉合 `Z`，roamer 連續繞圈，每圈鑽過摩天輪後方一次。
 * 小紅／多多已改走 map 層級路線；保留供 dev／未來島內啟用。
 */
export const CAR_PARK_WALKWAY_PATH =
  "M 72 196 C 56 150 92 110 130 104 C 158 100 184 132 188 172 C 188 202 116 212 72 196 Z";

/** 恐龍島步道：閉合迴圈，後段繞行火山後方（觸發遮擋）。tile 264×260 本地座標。 */
export const DINO_WALKWAY_PATH =
  "M 78 196 C 60 152 96 114 132 108 C 166 102 188 134 188 170 C 188 200 120 212 78 196 Z";

/** 英雄救援隊步道：閉合迴圈，後段繞行消防局後方。tile 264×260 本地座標。 */
export const RESCUE_WALKWAY_PATH =
  "M 80 198 C 64 158 98 122 134 116 C 168 110 190 142 190 176 C 190 204 122 214 80 198 Z";

/**
 * 海面環道（stage 座標）：繞 car-park 外海、接 car-park→dino 開放橋。
 * y 略低於橋面，讓車貼海／橋視覺。
 */
export const MAP_SEA_ORBIT_PATH =
  "M 420 455 Q 500 418 580 455 Q 650 490 580 520 Q 500 548 420 520 Q 350 488 420 455";

export type IslandRoamerRoute = {
  id: string;
  kind: "island";
  zoneId: ZoneId;
  tilePath: string;
  pingpong?: boolean;
};

export type MapRoamerRoute = {
  id: string;
  kind: "map";
  /** SVG path，stage 座標（0..MAP_STAGE） */
  d: string;
  pingpong?: boolean;
};

export type RoamerRoute = IslandRoamerRoute | MapRoamerRoute;

export function getRoutePathD(route: RoamerRoute): string {
  return route.kind === "island" ? route.tilePath : route.d;
}

/** 開放（非虛線）橋 path，供測試／dev 對照 */
export function getOpenBridgePaths(): string[] {
  return resolveUniverseMap()
    .bridges.filter((b) => !b.dashed)
    .map((b) => b.d);
}

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
  /** 島內漫遊必填；map 層級路線可省略 */
  zoneId?: ZoneId;
  routeId: string;
  /** path 取樣 px/s（tile 或 stage 依 route kind） */
  speed: number;
  /** 多方向 sprite（4 向＝front/rear × 左右鏡像）。未設則由 src 衍生（向後相容）。 */
  sprites?: RoamerSprites;
  /** 單張 fallback（舊資料／rear 未到位時的 front 來源）。 */
  src: string;
  srcNight?: string;
  enabled?: boolean;
  startOffset?: number;
};

function buildBridgeRoutes(): MapRoamerRoute[] {
  return resolveUniverseMap()
    .bridges.filter((b) => !b.dashed)
    .map((b) => ({
      id: `map-bridge-${b.id}`,
      kind: "map" as const,
      d: b.d,
      pingpong: true,
    }));
}

export const ROAMER_ROUTES: RoamerRoute[] = [
  {
    id: "car-park-walkway",
    kind: "island",
    zoneId: "car-park",
    tilePath: CAR_PARK_WALKWAY_PATH,
  },
  {
    id: "dino-walkway",
    kind: "island",
    zoneId: "dino",
    tilePath: DINO_WALKWAY_PATH,
  },
  {
    id: "rescue-walkway",
    kind: "island",
    zoneId: "rescue",
    tilePath: RESCUE_WALKWAY_PATH,
  },
  {
    id: "map-sea-orbit",
    kind: "map",
    d: MAP_SEA_ORBIT_PATH,
  },
  ...buildBridgeRoutes(),
];

export const MAP_ROAMERS: Roamer[] = [
  {
    id: "roam-xiaohong",
    characterId: "xiao-hong",
    routeId: "map-sea-orbit",
    speed: 38,
    src: "/adventures/roamers/xiao-hong.png",
    enabled: true,
    startOffset: 0,
  },
  {
    id: "roam-duoduo",
    characterId: "duo-duo",
    routeId: "map-sea-orbit",
    speed: 34,
    src: "/adventures/roamers/duo-duo.png",
    enabled: true,
    startOffset: 0.5,
  },
  // 恐龍島（building）：阿酷鑽地車 + 怪獸卡車
  {
    id: "roam-aku",
    characterId: "a-ku",
    zoneId: "dino",
    routeId: "dino-walkway",
    speed: 26,
    src: "/adventures/roamers/a-ku.png",
    sprites: {
      front: "/adventures/roamers/a-ku.png",
      rear: "/adventures/roamers/a-ku.rear.png",
    },
    enabled: true,
    startOffset: 0,
  },
  {
    id: "roam-monster",
    characterId: "monster-truck",
    zoneId: "dino",
    routeId: "dino-walkway",
    speed: 22,
    src: "/adventures/roamers/monster-truck.png",
    sprites: {
      front: "/adventures/roamers/monster-truck.png",
      rear: "/adventures/roamers/monster-truck.rear.png",
    },
    enabled: true,
    startOffset: 0.5,
  },
  // 英雄救援隊（coming）：亮亮警車 + 消防車點點。enabled=false，待產圖後開。
  {
    id: "roam-liangliang",
    characterId: "liang-liang",
    zoneId: "rescue",
    routeId: "rescue-walkway",
    speed: 27,
    src: "/adventures/roamers/liang-liang.png",
    startOffset: 0,
  },
  {
    id: "roam-diandian",
    characterId: "dian-dian",
    zoneId: "rescue",
    routeId: "rescue-walkway",
    speed: 23,
    src: "/adventures/roamers/dian-dian.png",
    startOffset: 0.55,
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

/**
 * 各島地標遮擋。clipPath 露出地標剪影、baselineY 為地標接地線（tile 本地 y px）。
 * 與島 art tile 同畫框（264×260），故百分比通用。未列出的島不做遮擋。
 */
export const ZONE_OCCLUDERS: Partial<Record<ZoneId, ZoneOccluder>> = {
  "car-park": { clipPath: "ellipse(20% 27% at 52% 26%)", baselineY: 134 }, // 摩天輪
  dino: { clipPath: "ellipse(21% 27% at 50% 26%)", baselineY: 128 }, // 火山
  rescue: { clipPath: "ellipse(23% 29% at 52% 30%)", baselineY: 140 }, // 消防局
  ocean: { clipPath: "ellipse(17% 27% at 48% 28%)", baselineY: 132 }, // 火箭
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
