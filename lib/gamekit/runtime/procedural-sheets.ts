import { MASTER_PALETTE } from "./palette";

export type SheetId = "blocks-drop";

const TILE = 16;

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

const BUILDERS: Record<SheetId, () => HTMLCanvasElement> = {
  "blocks-drop": buildBlocksDrop,
};

const cache = new Map<SheetId, HTMLCanvasElement>();

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
