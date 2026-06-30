import { MAP_STAGE } from "@/data/universe-zones";

export type MapDepthBand =
  | "sea"
  | "waterDecor"
  | "bridge"
  | "island"
  | "roamer"
  | "label";

const DEPTH_SCALE = 10;
const LABEL_BASE = (MAP_STAGE.height + 1) * DEPTH_SCALE;

const BAND_OFFSET: Record<Exclude<MapDepthBand, "label">, number> = {
  sea: 0,
  waterDecor: 2,
  bridge: 3,
  island: 6,
  roamer: 7,
};

/**
 * Shared 2.5D stage depth. For physical content, stage y dominates and band
 * offsets only break ties at the same ground line. Labels intentionally float
 * above the physical world.
 */
export function mapDepthZ(y: number, band: MapDepthBand): number {
  const yy = Math.round(y);
  if (band === "label") return LABEL_BASE + yy;
  return yy * DEPTH_SCALE + BAND_OFFSET[band];
}
