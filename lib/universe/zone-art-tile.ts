/**
 * 各島靜態 art tile 路徑與詮釋資料（`/public/adventures/zones/`）。
 * 詳見 docs/UNIVERSE-ART-BIBLE.md §10「與程式對接」。
 */
import type { ZoneId } from "@/data/universe-zones";

/** 小地標 icon（現況）：固定以島中心對齊 coord，疊在 UniverseMap 的 SVG 沙草橢圓上。 */
type LandmarkTile = {
  src: string;
  mode: "landmark";
  anchor: "center";
};

/** 整島 diorama：以沙岸底中心對齊 coord，需提供 stage 固有尺寸與圖內錨點位置。 */
type IslandTile = {
  src: string;
  mode: "island";
  anchor: "sand-bottom-center";
  /** tile 在 stage 座標系的固有尺寸（圖框 box；island 模式必填，故用 union 在編譯期強制）。 */
  stageSize: { w: number; h: number };
  /** 沙岸底中心在圖內相對位置 [u,v]，用來對齊 zone.coord（避免以圖底中心對齊導致島上移）。 */
  anchorUV: [number, number];
};

/** discriminated union：island 模式編譯期即強制帶 anchor + stageSize，無需 any／鬆散 optional。 */
export type ZoneArtTile = LandmarkTile | IslandTile;

/**
 * 各島 art tile 路徑（對應 `ZoneDef.artTile`）。
 *
 * R1（v2 黃金樣本落地）：四島皆已產出整島 diorama PNG（黏土風），故回傳 `.png`，
 * 交由前端 `<img srcSet>` 依 DPR 選 @2x/@3x（見 `getZoneArtSrcSet`）。SVG 小地標保留為歷史 fallback。
 */
export function zoneArtTilePath(id: ZoneId): string {
  return `/adventures/zones/${id}.png`;
}

/** 四島整島 box 與錨點統一（同一管線產製，跨島一致）：詳見 docs/UNIVERSE-ART-BIBLE.md。 */
const ISLAND_STAGE_SIZE = { w: 264, h: 260 } as const;
const ISLAND_ANCHOR_UV: [number, number] = [0.5, 0.84];

/**
 * Weenie（視覺磁鐵）：主題樂園地圖的中央地標原則——car-park 是全園核心，
 * 放大一級作為視線錨點與羅盤（迪士尼城堡手法）。只放大 stage 呈現尺寸，
 * 不動地理座標與錨點；PNG 有 @2x/@3x 餘裕，放大不糊。
 */
const HERO_SCALE = 1.25;
const HERO_STAGE_SIZE = {
  w: Math.round(ISLAND_STAGE_SIZE.w * HERO_SCALE),
  h: Math.round(ISLAND_STAGE_SIZE.h * HERO_SCALE),
} as const;

/**
 * 各島 tile 詮釋資料（單一資料源）。
 * R1：四島皆 `island` 模式（整島黏土 diorama）。`ZoneIsland` 以 anchorUV 對齊 coord、
 * 以 stageSize 鋪該島；`UniverseMap.tsx` 對 island 島**跳過 SVG 沙／草橢圓**（整島圖已含
 * 沙草與接地陰影，不關會疊圖）。
 */
export const ZONE_ART_TILES: Record<ZoneId, ZoneArtTile> = {
  "car-park": { src: zoneArtTilePath("car-park"), mode: "island", anchor: "sand-bottom-center", stageSize: HERO_STAGE_SIZE, anchorUV: ISLAND_ANCHOR_UV },
  dino: { src: zoneArtTilePath("dino"), mode: "island", anchor: "sand-bottom-center", stageSize: ISLAND_STAGE_SIZE, anchorUV: ISLAND_ANCHOR_UV },
  rescue: { src: zoneArtTilePath("rescue"), mode: "island", anchor: "sand-bottom-center", stageSize: ISLAND_STAGE_SIZE, anchorUV: ISLAND_ANCHOR_UV },
  ocean: { src: zoneArtTilePath("ocean"), mode: "island", anchor: "sand-bottom-center", stageSize: ISLAND_STAGE_SIZE, anchorUV: ISLAND_ANCHOR_UV },
  forest: { src: zoneArtTilePath("forest"), mode: "island", anchor: "sand-bottom-center", stageSize: ISLAND_STAGE_SIZE, anchorUV: ISLAND_ANCHOR_UV },
};

export function getZoneArtTile(id: ZoneId): ZoneArtTile {
  return ZONE_ART_TILES[id];
}

export { getZoneArtSrcSet } from "@/lib/universe/zone-art-src";
