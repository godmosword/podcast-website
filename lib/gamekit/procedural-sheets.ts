import { MASTER_PALETTE } from "./palette";

export type SheetId =
  | "tiles-common"
  | "firefly"
  | "blocks-drop"
  | "car-topdown";

const TILE = 16;

const C = {
  ink: MASTER_PALETTE[18],
  road: MASTER_PALETTE[19],
  roadLight: MASTER_PALETTE[20],
  cream: MASTER_PALETTE[22],
  yellow: MASTER_PALETTE[7],
  pink: MASTER_PALETTE[9],
  mint: MASTER_PALETTE[14],
  sky: MASTER_PALETTE[17],
  grass: MASTER_PALETTE[25],
  grassDark: MASTER_PALETTE[24],
  brick: MASTER_PALETTE[29],
  brickDark: MASTER_PALETTE[28],
  coin: MASTER_PALETTE[7],
  spike: MASTER_PALETTE[19],
  wheel: MASTER_PALETTE[18],
  glow: MASTER_PALETTE[23],
};

function sheet(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function px(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawRoadTile(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  px(ctx, ox, oy, TILE, TILE, C.road);
  px(ctx, ox + 2, oy + 7, TILE - 4, 2, C.roadLight);
  px(ctx, ox + 7, oy + 2, 2, TILE - 4, C.roadLight);
}

function drawGrassTile(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  px(ctx, ox, oy, TILE, TILE, C.grass);
  px(ctx, ox + 3, oy + 2, 2, 4, C.grassDark);
  px(ctx, ox + 10, oy + 8, 2, 3, C.grassDark);
  px(ctx, ox + 6, oy + 11, 2, 3, C.grassDark);
}

function drawBrickTile(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  px(ctx, ox, oy, TILE, TILE, C.brick);
  for (let row = 0; row < 4; row += 1) {
    const off = row % 2 === 0 ? 0 : 4;
    for (let col = 0; col < 3; col += 1) {
      px(ctx, ox + off + col * 6, oy + row * 4, 5, 3, C.brickDark);
    }
  }
}

function drawCoinTile(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  px(ctx, ox + 4, oy + 4, 8, 8, C.coin);
  px(ctx, ox + 6, oy + 5, 4, 2, C.cream);
}

function drawStarTile(ctx: CanvasRenderingContext2D, ox: number, oy: number): void {
  px(ctx, ox + 6, oy + 2, 4, 10, C.yellow);
  px(ctx, ox + 3, oy + 6, 10, 4, C.yellow);
  px(ctx, ox + 5, oy + 5, 6, 6, C.cream);
}

function drawFireflyFrame(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  bright: boolean,
): void {
  const core = bright ? C.yellow : C.coin;
  px(ctx, ox + 3, oy + 3, 2, 2, core);
  if (bright) {
    px(ctx, ox + 1, oy + 1, 6, 6, "rgba(255,255,255,0.15)");
  }
}

function drawBlockTile(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  body: string,
  highlight: string,
  shadow: string,
): void {
  px(ctx, ox, oy, TILE, TILE, shadow);
  px(ctx, ox + 1, oy + 1, TILE - 2, TILE - 2, body);
  px(ctx, ox + 2, oy + 2, TILE - 4, 3, highlight);
  px(ctx, ox + 2, oy + TILE - 4, TILE - 4, 2, shadow);
}

function drawCarTopdown(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  color: string,
  dark: string,
): void {
  px(ctx, ox + 4, oy + 2, 8, 12, color);
  px(ctx, ox + 2, oy + 6, 12, 4, color);
  px(ctx, ox + 5, oy + 4, 6, 4, C.sky);
  px(ctx, ox + 3, oy + 10, 3, 3, dark);
  px(ctx, ox + 10, oy + 10, 3, 3, dark);
}

function buildTilesCommon(): HTMLCanvasElement {
  const c = sheet(TILE * 6, TILE);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  drawRoadTile(ctx, 0, 0);
  drawGrassTile(ctx, TILE, 0);
  drawBrickTile(ctx, TILE * 2, 0);
  drawCoinTile(ctx, TILE * 3, 0);
  drawStarTile(ctx, TILE * 4, 0);
  px(ctx, TILE * 5, 0, TILE, TILE, C.spike);
  for (let i = 0; i < 3; i += 1) {
    px(ctx, TILE * 5 + 4 + i * 4, 4, 2, 8, C.cream);
  }
  return c;
}

function buildFirefly(): HTMLCanvasElement {
  const c = sheet(16, 8);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  drawFireflyFrame(ctx, 0, 0, true);
  drawFireflyFrame(ctx, 8, 0, false);
  return c;
}

function buildBlocksDrop(): HTMLCanvasElement {
  const c = sheet(TILE * 7, TILE);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  const blocks: [string, string, string][] = [
    [MASTER_PALETTE[17], MASTER_PALETTE[5], MASTER_PALETTE[2]],
    [MASTER_PALETTE[7], MASTER_PALETTE[8], MASTER_PALETTE[29]],
    [MASTER_PALETTE[11], MASTER_PALETTE[10], MASTER_PALETTE[3]],
    [MASTER_PALETTE[13], MASTER_PALETTE[14], MASTER_PALETTE[2]],
    [MASTER_PALETTE[6], MASTER_PALETTE[5], MASTER_PALETTE[0]],
    [MASTER_PALETTE[15], MASTER_PALETTE[16], MASTER_PALETTE[1]],
    [MASTER_PALETTE[27], MASTER_PALETTE[28], MASTER_PALETTE[29]],
  ];
  blocks.forEach(([body, hi, sh], i) =>
    drawBlockTile(ctx, i * TILE, 0, body, hi, sh),
  );
  return c;
}

function buildCarTopdown(): HTMLCanvasElement {
  const c = sheet(TILE * 3, TILE);
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  drawCarTopdown(ctx, 0, 0, MASTER_PALETTE[7], MASTER_PALETTE[29]);
  drawCarTopdown(ctx, TILE, 0, MASTER_PALETTE[6], MASTER_PALETTE[0]);
  drawCarTopdown(ctx, TILE * 2, 0, MASTER_PALETTE[9], MASTER_PALETTE[3]);
  return c;
}

const BUILDERS: Record<SheetId, () => HTMLCanvasElement> = {
  "tiles-common": buildTilesCommon,
  firefly: buildFirefly,
  "blocks-drop": buildBlocksDrop,
  "car-topdown": buildCarTopdown,
};

const cache = new Map<SheetId, HTMLCanvasElement>();
const tileUrlCache = new Map<string, string>();

/** 瀏覽器環境：程序生成像素 sprite sheet（Phase 2 佔位，日後換 PNG）。 */
export function getGameSheet(id: SheetId): HTMLCanvasElement {
  if (typeof document === "undefined") {
    throw new Error("getGameSheet 僅能在瀏覽器使用");
  }
  const hit = cache.get(id);
  if (hit) return hit;
  const built = BUILDERS[id]();
  cache.set(id, built);
  return built;
}

export function clearGameSheetCache(): void {
  cache.clear();
  tileUrlCache.clear();
}

/** 從 sheet 裁切單格 tile 的 data URL（供 DOM/CSS 用）。 */
export function sheetTileDataUrl(
  sheetId: SheetId,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
): string {
  const key = `${sheetId}:${sx},${sy},${sw}x${sh}`;
  const hit = tileUrlCache.get(key);
  if (hit) return hit;

  const src = getGameSheet(sheetId);
  const crop = document.createElement("canvas");
  crop.width = sw;
  crop.height = sh;
  const ctx = crop.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
  const url = crop.toDataURL("image/png");
  tileUrlCache.set(key, url);
  return url;
}

export const TILE_SIZE = TILE;

export const TILE_INDEX = {
  road: 0,
  grass: 1,
  brick: 2,
  coin: 3,
  star: 4,
  spike: 5,
} as const;

export function tileUrl(index: number): string {
  return sheetTileDataUrl("tiles-common", index * TILE, 0, TILE, TILE);
}

export function blockUrl(index: number): string {
  return sheetTileDataUrl("blocks-drop", index * TILE, 0, TILE, TILE);
}

export const BLOCK_INDEX: Record<string, number> = {
  I: 0,
  O: 1,
  T: 2,
  S: 3,
  Z: 4,
  J: 5,
  L: 6,
};
