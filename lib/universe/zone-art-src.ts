import type { ZoneId } from "@/data/universe-zones";
import { zoneArtTilePath } from "@/lib/universe/zone-art-tile";

/** 對齊 `useMapCamera` MAX_SCALE；供 srcset sizes 估算最大顯示寬。 */
export const ZONE_ART_SRC_MAX_SCALE = 2.4;

/** 四島整島 tile 固有寬（stage px）。 */
export const ZONE_ART_TILE_WIDTH = 264;

export type ZoneArtSrcSet = {
  src: string;
  srcSet: string;
  sizes: string;
};

function zoneArtTilePathAtDensity(id: ZoneId, density: 1 | 2 | 3): string {
  const base = zoneArtTilePath(id);
  if (density === 1) return base;
  return base.replace(/\.png$/, `@${density}x.png`);
}

/** 依鏡頭縮放估算 tile 顯示寬（對齊 `useMapCamera` MIN/MAX）。 */
export function getZoneArtSizes(mapScale: number = ZONE_ART_SRC_MAX_SCALE): string {
  const clamped = Math.max(0.6, Math.min(ZONE_ART_SRC_MAX_SCALE, mapScale));
  return `${Math.ceil(ZONE_ART_TILE_WIDTH * clamped)}px`;
}

/** 組 island tile 的 width-descriptor srcset（1x/2x/3x 檔已備於 public）。 */
export function getZoneArtSrcSet(
  id: ZoneId,
  mapScale: number = ZONE_ART_SRC_MAX_SCALE,
): ZoneArtSrcSet {
  const w = ZONE_ART_TILE_WIDTH;
  const src = zoneArtTilePathAtDensity(id, 1);
  const srcSet = [
    `${zoneArtTilePathAtDensity(id, 1)} ${w}w`,
    `${zoneArtTilePathAtDensity(id, 2)} ${w * 2}w`,
    `${zoneArtTilePathAtDensity(id, 3)} ${w * 3}w`,
  ].join(", ");
  return { src, srcSet, sizes: getZoneArtSizes(mapScale) };
}
