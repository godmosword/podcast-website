/**
 * 島嶼接地幾何（接地陰影 + 淺灘光暈）的單一資料源。
 *
 * 重構前 `UniverseMap.tsx` 對五島硬寫同一組 `rx=112 ry=34 cy=+30`，
 * 於是 hero 島（car-park，1.25× stage）用了跟一般島一樣大的影子而看起來在飄。
 * 這裡改由 `ZoneArtTile.stageSize` 推導，島放大時接地一起放大。
 *
 * 見 docs/UNIVERSE-ART-BIBLE.md §2（單一短柔接地陰影）與 §14（淺灘）。
 */
import type { ZoneId } from "@/data/universe-zones";
import { getZoneArtTile } from "./zone-art-tile";

export type GroundEllipse = { cx: number; cy: number; rx: number; ry: number };

export type IslandGround = {
  /** 島底單一短柔接地陰影（Art Bible §2）。 */
  shadow: GroundEllipse;
  /** 淺灘光暈：更寬更扁的水色暈，讓島讀作「泡在水裡」而非貼在海面上。 */
  shoal: GroundEllipse;
};

export type StageSize = { w: number; h: number };
export type StageAnchor = { x: number; y: number };

/** 基準島（264×260）沿用重構前的實測值，換算成比例後對所有尺寸一致套用。 */
const BASE_TILE_W = 264;
const BASE_TILE_H = 260;

const SHADOW_RX_RATIO = 112 / BASE_TILE_W;
const SHADOW_RY_RATIO = 34 / BASE_TILE_W;
const SHADOW_CY_RATIO = 30 / BASE_TILE_H;

/**
 * 淺灘相對接地影的倍率。刻意「更寬 > 更高」，讓它讀作水面向外散開的水深漸變，
 * 而不是第二顆影子；且整體位置略高於接地影，接地影仍是視覺上的接觸點。
 */
const SHOAL_RX_SCALE = 1.62;
const SHOAL_RY_SCALE = 1.34;
const SHOAL_CY_RATIO = 22 / BASE_TILE_H;

/** 由 tile 固有尺寸與 stage 錨點（沙岸底中心）推導接地幾何。 */
export function islandGroundFor(
  stageSize: StageSize,
  anchor: StageAnchor,
): IslandGround {
  const rx = Math.round(stageSize.w * SHADOW_RX_RATIO);
  const ry = Math.round(stageSize.w * SHADOW_RY_RATIO);
  return {
    shadow: {
      cx: anchor.x,
      cy: anchor.y + Math.round(stageSize.h * SHADOW_CY_RATIO),
      rx,
      ry,
    },
    shoal: {
      cx: anchor.x,
      cy: anchor.y + Math.round(stageSize.h * SHOAL_CY_RATIO),
      rx: Math.round(rx * SHOAL_RX_SCALE),
      ry: Math.round(ry * SHOAL_RY_SCALE),
    },
  };
}

/**
 * 取某島的接地幾何；非 island 模式（歷史 landmark fallback）回傳 null，
 * 呼叫端沿用既有 SVG 沙草底座路徑。
 */
export function getIslandGround(
  id: ZoneId,
  anchor: StageAnchor,
): IslandGround | null {
  const tile = getZoneArtTile(id);
  if (tile.mode !== "island") return null;
  return islandGroundFor(tile.stageSize, anchor);
}
