import { snapPixel } from "./palette";

/** HUD 用等寬點陣風格（Phase 1 可換 bitmap font atlas）。 */
const PIXEL_FONT_FAMILY =
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
