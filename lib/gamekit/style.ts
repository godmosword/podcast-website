import { snapPixel } from "./palette";

/** HUD 用等寬點陣風格（Phase 1 可換 bitmap font atlas）。 */
export const PIXEL_FONT_FAMILY =
  'ui-monospace, "Cascadia Mono", "Segoe UI Mono", monospace';

export type DrawPixelTextOptions = {
  color?: string;
  scale?: number;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  shadow?: boolean;
};

export function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: DrawPixelTextOptions = {},
): void {
  const scale = options.scale ?? 1;
  const color = options.color ?? "#fff8f0";
  const align = options.align ?? "left";
  const baseline = options.baseline ?? "top";

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.font = `${8 * scale}px ${PIXEL_FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  const px = snapPixel(x);
  const py = snapPixel(y);

  if (options.shadow) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillText(text, px + scale, py + scale);
  }

  ctx.fillStyle = color;
  ctx.fillText(text, px, py);
  ctx.restore();
}

/** 簡易面板（圓角用矩形近似，Phase 1 換 sprite UI）。 */
export function drawPixelPanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  border?: string,
): void {
  const px = snapPixel(x);
  const py = snapPixel(y);
  const pw = snapPixel(w);
  const ph = snapPixel(h);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = fill;
  ctx.fillRect(px, py, pw, ph);
  if (border) {
    ctx.strokeStyle = border;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
  }
  ctx.restore();
}
