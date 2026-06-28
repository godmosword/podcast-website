import type { ZoneId } from "@/data/universe-zones";

/** car-park 島內步道（tile 264×260 本地座標；對齊 universe-zone-motion mascot-car） */
export const CAR_PARK_WALKWAY_PATH =
  "M 72 188 Q 132 172 192 178 T 252 188";

export type RoamerRoute = {
  id: string;
  kind: "island";
  zoneId: ZoneId;
  /** SVG path，tile 本地座標（0..stageSize） */
  tilePath: string;
  /** true=到底回頭；預設 false=循環回起點 */
  pingpong?: boolean;
};

export type Roamer = {
  id: string;
  characterId: string;
  zoneId: ZoneId;
  routeId: string;
  /** tile 本地 px/s（path 長度比例） */
  speed: number;
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
