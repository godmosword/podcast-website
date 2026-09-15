import { MAP_STAGE, MAP_STAGE_PORTRAIT } from "@/data/universe-zones";

export type MapDepthBand =
  | "sea"
  | "waterDecor"
  | "bridge"
  | "island"
  | "roamer"
  | "label"
  | "hotspot"
  | "bubble";

const DEPTH_SCALE = 10;
/**
 * 帶寬以**最高的舞台**為準（直式 1400 > 橫式 720）：物理層 z = y×10 最大 14000，
 * label／hotspot／bubble 帶必須整個落在它之上，否則直式最下方的島會蓋掉所有木牌
 * （美術審 H3 e2e 實測：ocean y=1310 → z 13106 > 橫式 LABEL_BASE 7210）。
 */
const DEPTH_MAX_Y = Math.max(MAP_STAGE.height, MAP_STAGE_PORTRAIT.height);
const LABEL_BASE = (DEPTH_MAX_Y + 1) * DEPTH_SCALE;
/** 探索點：互動元件不該被裝飾木牌壓住，故整層在 label 之上。 */
const HOTSPOT_BASE = LABEL_BASE + DEPTH_MAX_Y + 1;
/** 島泡泡：短暫對話最上層，連探索點都不遮它。 */
const BUBBLE_BASE = HOTSPOT_BASE + DEPTH_MAX_Y + 1;

const BAND_OFFSET: Record<
  Exclude<MapDepthBand, "label" | "hotspot" | "bubble">,
  number
> = {
  sea: 0,
  waterDecor: 2,
  bridge: 3,
  island: 6,
  roamer: 7,
};

/**
 * Shared 2.5D stage depth. For physical content, stage y dominates and band
 * offsets only break ties at the same ground line. Labels, hotspots and
 * bubbles intentionally float above the physical world, in that order.
 */
export function mapDepthZ(y: number, band: MapDepthBand): number {
  const yy = Math.round(y);
  if (band === "label") return LABEL_BASE + yy;
  if (band === "hotspot") return HOTSPOT_BASE + yy;
  if (band === "bubble") return BUBBLE_BASE + yy;
  return yy * DEPTH_SCALE + BAND_OFFSET[band];
}

/**
 * 大氣透視強度（0＝最近、1＝最遠），由同一個 stage y 推導，與 `mapDepthZ` 共用深度語彙。
 *
 * 消費端是 `ZoneIsland` 的 `--island-haze`：遠島輕微降飽和／降對比／提亮，
 * 讓五島不再全部一樣銳利。幅度刻意保守（Art Bible §14.2 遠景去飽和 15–25% 的下半段），
 * 因為五島 y 差距遠小於真正的遠景，過強會讀成「島髒掉」而不是「島退後」。
 */
export function islandHaze(y: number, stageHeight: number = MAP_STAGE.height): number {
  const t = y / stageHeight;
  return Math.min(1, Math.max(0, 1 - t));
}
