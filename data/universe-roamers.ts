import { MAP_STAGE } from "@/data/universe-zones";

export type RoamerRoute = {
  id: string;
  /** SVG path，STAGE 座標（0..MAP_STAGE.width × height） */
  d: string;
  /** true=到底回頭；預設 false=循環回起點 */
  pingpong?: boolean;
};

export type Roamer = {
  id: string;
  /** 對應 data/characters.ts 的 Character.id */
  characterId: string;
  routeId: string;
  /** stage 單位/秒 */
  speed: number;
  /** /adventures/roamers/{characterId}.png（朝左 ¾ 黏土小車） */
  src: string;
  srcNight?: string;
  /** 資產齊前 false；dev 用 ?devRoamers=1 開佔位 */
  enabled?: boolean;
  /** 0..1 起始位置，避免多車重疊 */
  startOffset?: number;
};

/** v1：stage 座標路線（與 zones.px / bridges.d 同空間） */
export const ROAMER_ROUTES: RoamerRoute[] = [
  {
    id: "carpark-loop",
    d: "M 430 470 Q 500 432 570 470 Q 500 508 430 470 Z",
  },
];

export const MAP_ROAMERS: Roamer[] = [
  {
    id: "roam-xiaohong",
    characterId: "xiao-hong",
    routeId: "carpark-loop",
    speed: 42,
    src: "/adventures/roamers/xiao-hong.png",
    enabled: false,
    startOffset: 0,
  },
];

export const ROAMER_BOUNDS = MAP_STAGE;

export function shouldRenderRoamer(roamer: Roamer, devRoamers: boolean): boolean {
  if (roamer.enabled) return true;
  if (devRoamers && process.env.NODE_ENV !== "production") return true;
  return false;
}

/** dev 用 ?devRoamers=1（僅非 production） */
export function isDevRoamersQuery(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("devRoamers") === "1";
}
