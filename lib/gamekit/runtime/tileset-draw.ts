import { snapPixel } from "./palette";
import {
  getGameSheet,
  TILE_INDEX,
  TILE_SIZE,
  type SheetId,
} from "./procedural-sheets";

function drawKitTile(
  ctx: CanvasRenderingContext2D,
  sheetId: SheetId,
  tileCol: number,
  dx: number,
  dy: number,
  scale = 1,
): void {
  const sheet = getGameSheet(sheetId);
  const size = TILE_SIZE * scale;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sheet,
    tileCol * TILE_SIZE,
    0,
    TILE_SIZE,
    TILE_SIZE,
    dx,
    dy,
    size,
    size,
  );
  ctx.restore();
}

/** 橫向過關：依實心格繪製草地＋土磚 tile。 */
export function drawAdventureGroundTile(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tilePx: number,
  hasGrassTop: boolean,
): void {
  const px = snapPixel(sx);
  const py = snapPixel(sy);
  drawKitTile(
    ctx,
    "tiles-common",
    TILE_INDEX.brick,
    px,
    py,
    tilePx / TILE_SIZE,
  );
  if (hasGrassTop) {
    drawKitTile(
      ctx,
      "tiles-common",
      TILE_INDEX.grass,
      px,
      py,
      tilePx / TILE_SIZE,
    );
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(px, py + tilePx - 4, tilePx, 4);
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.08)";
    ctx.fillRect(px, py + tilePx - 4, tilePx, 4);
  }
}

export function drawAdventureCoin(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  const size = radius * 2;
  drawKitTile(
    ctx,
    "tiles-common",
    TILE_INDEX.coin,
    x - radius,
    y - radius,
    size / TILE_SIZE,
  );
}

export function drawAdventureSpike(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  tilePx: number,
): void {
  drawKitTile(
    ctx,
    "tiles-common",
    TILE_INDEX.spike,
    snapPixel(sx),
    snapPixel(sy),
    tilePx / TILE_SIZE,
  );
}
