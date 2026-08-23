/**
 * 車車宇宙：園區（島）相容層。
 * 權威資料在 `data/universe.ts`（0–1 世界座標；Zod 契約在 universe.schema.ts）；
 * 本檔把 Zone 轉成既有 `ZoneDef`（MAP_STAGE px），供地圖／sheet／e2e 零差消費。
 */
import {
  LANDING_SEGMENT_IDS,
  type LandingSegmentId,
} from "@/data/landing-segments";
import {
  MAP_STAGE,
  STATUS_META,
  ZONE_IDS,
  universe,
  worldToStage,
  type Zone,
  type ZoneId,
  type ZoneStatus,
} from "@/data/universe";

export { MAP_STAGE, ZONE_IDS, STATUS_META };
export type { ZoneId, ZoneStatus };

/** @deprecated 請改用 STATUS_META */
export const ZONE_STATUS_META = STATUS_META;

export type ZoneCoord = { x: number; y: number }; // 0..MAP_STAGE.width / height

export type ZoneDef = {
  id: ZoneId;
  name: string;
  shortName?: string;
  status: ZoneStatus;
  coord: ZoneCoord;
  /** R0 emoji 摘要（資料／fallback）；R1 地圖顯示用 `ZoneLandmarkArt` */
  landmark: string;
  /** 可選靜態 tile（`/adventures/zones/{id}.png`）；未設則用 inline SVG */
  artTile?: string;
  teaser: string;
  /** 未開放島嶼兒童首屏短句（≤10 字；≠ exploreNote 截短）。 */
  childHint?: string;
  /** 未開放島嶼的低壓探索說明：先告知狀態，不要求互動或投票。 */
  exploreNote?: string;
  /** 未開放島嶼可提供的溫和導向，例如回故事屋或已開放園區。 */
  softLinks?: { label: string; href: string; external?: boolean }[];
  buildProgress?: number;
  /** 連到哪一座島的橋來源（resolver 用來生成橋路徑） */
  bridgeFrom?: ZoneId;
  /** open 島才需要：點擊後導向。可為內部路由或外連。 */
  route?: { href: string; external?: boolean };
  /** 僅 car-park：子設施＝既有四段 segment（單一資料源，勿重刻 href） */
  subSegmentIds?: LandingSegmentId[];
};

/** 各島 SVG 底座配色（固定淺色，不隨日夜反轉） */
export const ZONE_TERRAIN: Record<ZoneId, { sand: string; grass: string }> = {
  "car-park": { sand: "#f3e3bd", grass: "#dcefc4" },
  dino: { sand: "#f0e0b8", grass: "#d4efc0" },
  rescue: { sand: "#f2e4c8", grass: "#cfe8dc" },
  ocean: { sand: "#ebe4d4", grass: "#d0e4f5" },
  forest: { sand: "#ede0c4", grass: "#b8dfa8" },
};

/** Zone（0–1）→ ZoneDef（stage px），供既有元件消費。 */
export function zoneToDef(zone: Zone): ZoneDef {
  return {
    id: zone.id,
    name: zone.name,
    shortName: zone.shortName,
    status: zone.status,
    coord: worldToStage(zone.world),
    landmark: zone.landmark,
    artTile: zone.sprite,
    teaser: zone.tagline,
    childHint: zone.childHint,
    exploreNote: zone.exploreNote,
    softLinks: zone.links.length > 0 ? [...zone.links] : undefined,
    buildProgress: zone.buildProgress,
    bridgeFrom: zone.bridgeFrom,
    route: zone.route,
    subSegmentIds: zone.subSegmentIds
      ? [...zone.subSegmentIds]
      : undefined,
  };
}

/** 相容匯出：與重構前相同的五島 px 座標／狀態。 */
export const ZONES: ZoneDef[] = universe.zones.map(zoneToDef);

// 編譯期確認 car-park 子設施仍掛 LANDING_SEGMENT_IDS（避免靜默丟段）
const _carPark = ZONES.find((z) => z.id === "car-park");
if (
  _carPark &&
  (_carPark.subSegmentIds?.length ?? 0) !== LANDING_SEGMENT_IDS.length
) {
  throw new Error("car-park.subSegmentIds 必須對齊 LANDING_SEGMENT_IDS");
}
