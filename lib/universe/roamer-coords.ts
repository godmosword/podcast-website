import { type ZoneId } from "@/data/universe-zones";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";

export type TileOrigin = {
  left: number;
  top: number;
  w: number;
  h: number;
};

/** 島 tile 左上角在 stage 座標（px 1:1 coord）。 */
export function islandTileOrigin(
  zoneId: ZoneId,
  zonePx: { x: number; y: number },
): TileOrigin {
  const tile = getZoneArtTile(zoneId);
  if (tile.mode !== "island") {
    throw new Error(`${zoneId} 非 island 模式，無 tile 本地座標`);
  }
  const [ax, ay] = tile.anchorUV;
  const { w, h } = tile.stageSize;
  return {
    left: zonePx.x - ax * w,
    top: zonePx.y - ay * h,
    w,
    h,
  };
}

/** tile 本地像素 → stage 絕對像素。 */
export function tileLocalToStage(
  zoneId: ZoneId,
  local: { x: number; y: number },
  zonePx: { x: number; y: number },
): { x: number; y: number } {
  const { left, top } = islandTileOrigin(zoneId, zonePx);
  return { x: left + local.x, y: top + local.y };
}
