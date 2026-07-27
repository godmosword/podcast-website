import { MAP_STAGE } from "@/data/universe-zones";

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
const LABEL_BASE = (MAP_STAGE.height + 1) * DEPTH_SCALE;
/** 探索點：互動元件不該被裝飾木牌壓住，故整層在 label 之上。 */
const HOTSPOT_BASE = LABEL_BASE + MAP_STAGE.height + 1;
/** 島泡泡：短暫對話最上層，連探索點都不遮它。 */
const BUBBLE_BASE = HOTSPOT_BASE + MAP_STAGE.height + 1;

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
