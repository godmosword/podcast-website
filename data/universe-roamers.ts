import type { ZoneId } from "@/data/universe-zones";
import { getCharacterName } from "@/data/characters";
import { resolveUniverseMap } from "@/lib/universe-map";

/**
 * car-park 島內步道（tile 330×325 hero box 本地座標；weenie 放大 1.25×）。
 * 保留供 tapJoyride／`?devRoamers=1`；prod 招牌車改 `idleSpot`，不再閉合巡邏。
 */
export const CAR_PARK_WALKWAY_PATH =
  "M 90 245 C 70 187.5 115 137.5 162.5 130 C 197.5 125 230 165 235 215 C 235 252.5 145 265 90 245 Z";

/** 恐龍島步道（joyride／dev）。tile 264×260 本地座標。 */
const DINO_WALKWAY_PATH =
  "M 78 196 C 60 152 96 114 132 108 C 166 102 188 134 188 170 C 188 200 120 212 78 196 Z";

/** 英雄救援隊步道（joyride／dev）。tile 264×260 本地座標。 */
const RESCUE_WALKWAY_PATH =
  "M 80 198 C 64 158 98 122 134 116 C 168 110 190 142 190 176 C 190 204 122 214 80 198 Z";

type IslandRoamerRoute = {
  id: string;
  kind: "island";
  zoneId: ZoneId;
  tilePath: string;
  pingpong?: boolean;
};

type MapRoamerRoute = {
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

/** 定點展示座標（island＝tile 本地 px；map＝stage px）。 */
export type RoamerIdleSpot = {
  x: number;
  y: number;
  facing?: RoamerDir;
  /** 1＝面朝左（基準圖）；-1＝鏡像面朝右 */
  flip?: 1 | -1;
};

/** 主島招牌位：摩天輪前方草地（y > baselineY 168）。 */
export const CAR_PARK_SIGNBOARD_SPOT: RoamerIdleSpot = {
  x: 168,
  y: 230,
  facing: "front",
  flip: 1,
};

/** 恐龍島招牌位：火山前方（y > baselineY 128）。 */
export const DINO_SIGNBOARD_SPOT: RoamerIdleSpot = {
  x: 132,
  y: 185,
  facing: "front",
  flip: 1,
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
  /**
   * 定點 idle。有值時 prod 預設不巡邏；移動只發生在
   * tapJoyride（`joyrideRouteId`）或 rareCrossing（`crossingRouteId`）。
   */
  idleSpot?: RoamerIdleSpot;
  /** map 稀有跨島：對應 `ROAMER_ROUTES` 的 map-bridge-* id */
  crossingRouteId?: string;
  /** 點擊短兜風：對應島內／短程 route id；無則只打招呼 */
  joyrideRouteId?: string;
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
  // 開放橋 map 路線：rareCrossing 與 `?devRoamers=1` 橋線視覺化。
  ...buildBridgeRoutes(),
];

function openIslandBridgeIdleSpot(): RoamerIdleSpot {
  const bridge = resolveUniverseMap().bridges.find((b) => b.id === "car-park-dino");
  if (!bridge) {
    return { x: 346.9, y: 442.64, facing: "front", flip: -1 };
  }
  return {
    x: bridge.fromPort.x,
    y: bridge.fromPort.y,
    facing: "front",
    flip: -1,
  };
}

export const MAP_ROAMERS: Roamer[] = [
  // 遠景（open 島池）：小紅停在車車樂園橋頭，偶爾過橋去恐龍島。
  {
    id: "map-xiaohong",
    characterId: "xiao-hong",
    routeId: "map-bridge-car-park-dino",
    speed: 22,
    src: "/adventures/roamers/xiao-hong.png",
    enabled: true,
    idleSpot: openIslandBridgeIdleSpot(),
    crossingRouteId: "map-bridge-car-park-dino",
  },
  // 近景招牌：車車樂園小紅（摩天輪前 idle；點擊可短 joyride）。
  {
    id: "roam-xiaohong",
    characterId: "xiao-hong",
    zoneId: "car-park",
    routeId: "car-park-walkway",
    speed: 26,
    src: "/adventures/roamers/xiao-hong.png",
    enabled: true,
    idleSpot: CAR_PARK_SIGNBOARD_SPOT,
    joyrideRouteId: "car-park-walkway",
  },
  // 近景招牌：恐龍島阿酷（每島一台；怪獸卡車改 disabled）。
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
    idleSpot: DINO_SIGNBOARD_SPOT,
    joyrideRouteId: "dino-walkway",
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
    enabled: false,
    startOffset: 0.5,
    idleSpot: { x: 160, y: 200, facing: "front", flip: -1 },
    joyrideRouteId: "dino-walkway",
  },
  // 英雄救援隊（coming）：enabled=false，待產圖後開。
  {
    id: "roam-liangliang",
    characterId: "liang-liang",
    zoneId: "rescue",
    routeId: "rescue-walkway",
    speed: 27,
    src: "/adventures/roamers/liang-liang.png",
    startOffset: 0,
    idleSpot: { x: 134, y: 190, facing: "front", flip: 1 },
    joyrideRouteId: "rescue-walkway",
  },
  {
    id: "roam-diandian",
    characterId: "dian-dian",
    zoneId: "rescue",
    routeId: "rescue-walkway",
    speed: 23,
    src: "/adventures/roamers/dian-dian.png",
    startOffset: 0.55,
    idleSpot: { x: 150, y: 200, facing: "front", flip: -1 },
    joyrideRouteId: "rescue-walkway",
  },
];

/** 有 idleSpot ＝ prod 預設定點展示（不巡邏）。 */
export function roamerUsesIdleSpot(roamer: Roamer): boolean {
  return Boolean(roamer.idleSpot);
}

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
 * clipPath 為 tile box 百分比、跨尺寸通用；baselineY 為該島 box 的絕對 px——
 * car-park 為 hero box 330×325（weenie 1.25×），其餘三島 264×260。
 */
export const ZONE_OCCLUDERS: Partial<Record<ZoneId, ZoneOccluder>> = {
  "car-park": { clipPath: "ellipse(20% 27% at 52% 26%)", baselineY: 168 }, // 摩天輪（134×1.25）
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

export function roamerGreeting(characterId: string): string {
  const name = getCharacterName(characterId);
  return name ? `嗨！我是${name}！` : "嗨！";
}
