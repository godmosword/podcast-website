import type { ZoneId } from "@/data/universe-zones";
import { pngToWebp } from "@/lib/universe/png-to-webp";
import { zoneArtTilePath } from "@/lib/universe/zone-art-tile";

/** 對齊 `useMapCamera` MAX_SCALE；供 srcset sizes 估算最大顯示寬。 */
export const ZONE_ART_SRC_MAX_SCALE = 2.4;

/** 四島整島 tile 固有寬（stage px）。 */
export const ZONE_ART_TILE_WIDTH = 264;

export type ZoneArtSrcSet = {
  /** PNG fallback */
  src: string;
  srcSet: string;
  webpSrc: string;
  webpSrcSet: string;
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
  const png1 = zoneArtTilePathAtDensity(id, 1);
  const png2 = zoneArtTilePathAtDensity(id, 2);
  const png3 = zoneArtTilePathAtDensity(id, 3);
  const srcSet = [`${png1} ${w}w`, `${png2} ${w * 2}w`, `${png3} ${w * 3}w`].join(", ");
  const webpSrcSet = [
    `${pngToWebp(png1)} ${w}w`,
    `${pngToWebp(png2)} ${w * 2}w`,
    `${pngToWebp(png3)} ${w * 3}w`,
  ].join(", ");
  return {
    src: png1,
    srcSet,
    webpSrc: pngToWebp(png1),
    webpSrcSet,
    sizes: getZoneArtSizes(mapScale),
  };
}
