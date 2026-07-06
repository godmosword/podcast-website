import type { ZoneId } from "@/data/universe-zones";
import { pngToWebp } from "@/lib/universe/png-to-webp";
import { getZoneArtTile, zoneArtTilePath } from "@/lib/universe/zone-art-tile";

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

export type ZoneArtVariant = "day" | "night";

function zoneArtTilePathAtDensity(
  id: ZoneId,
  density: 1 | 2 | 3,
  variant: ZoneArtVariant = "day",
): string {
  const base =
    variant === "night"
      ? zoneArtTilePath(id).replace(/\.png$/, ".night.png")
      : zoneArtTilePath(id);
  if (density === 1) return base;
  return base.replace(/\.png$/, `@${density}x.png`);
}

/** 依鏡頭縮放估算 tile 顯示寬（對齊 `useMapCamera` MIN/MAX）。 */
export function getZoneArtSizes(mapScale: number = ZONE_ART_SRC_MAX_SCALE): string {
  const clamped = Math.max(0.6, Math.min(ZONE_ART_SRC_MAX_SCALE, mapScale));
  return `${Math.ceil(ZONE_ART_TILE_WIDTH * clamped)}px`;
}

/** 組指定變體（day／night）的 width-descriptor srcset；night 路徑循 §12.6 點號慣例。 */
export function buildZoneArtSrcSet(
  id: ZoneId,
  mapScale: number,
  variant: ZoneArtVariant,
): ZoneArtSrcSet {
  const w = ZONE_ART_TILE_WIDTH;
  const png1 = zoneArtTilePathAtDensity(id, 1, variant);
  const png2 = zoneArtTilePathAtDensity(id, 2, variant);
  const png3 = zoneArtTilePathAtDensity(id, 3, variant);
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

/** 組 island tile 的 width-descriptor srcset（1x/2x/3x 檔已備於 public）。 */
export function getZoneArtSrcSet(
  id: ZoneId,
  mapScale: number = ZONE_ART_SRC_MAX_SCALE,
): ZoneArtSrcSet {
  return buildZoneArtSrcSet(id, mapScale, "day");
}

/**
 * 夜間點燈版 srcset（R-joy 3，`zones/{id}.night.png` 系列）。
 * 該島 `hasNightArt` 未翻 true（資產未落地）時回傳 null——呼叫端沿用日圖，零 404。
 */
export function getZoneNightArtSrcSet(
  id: ZoneId,
  mapScale: number = ZONE_ART_SRC_MAX_SCALE,
): ZoneArtSrcSet | null {
  const tile = getZoneArtTile(id);
  if (tile.mode !== "island" || !tile.hasNightArt) return null;
  return buildZoneArtSrcSet(id, mapScale, "night");
}
