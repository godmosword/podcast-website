/** 著色畫布純函式：油漆桶、顏色常數、草稿 key。 */

export type Rgba = readonly [number, number, number, number];

export type ColoringTool = "crayon" | "bucket" | "eraser";

export const COLORING_PALETTE: readonly {
  id: string;
  name: string;
  hex: string;
  rgba: Rgba;
}[] = [
  { id: "red", name: "紅色", hex: "#e85d4c", rgba: [232, 93, 76, 255] },
  { id: "orange", name: "橘色", hex: "#f4a261", rgba: [244, 162, 97, 255] },
  { id: "yellow", name: "黃色", hex: "#f2c94c", rgba: [242, 201, 76, 255] },
  { id: "lime", name: "草綠", hex: "#6fcf97", rgba: [111, 207, 151, 255] },
  { id: "green", name: "綠色", hex: "#27ae60", rgba: [39, 174, 96, 255] },
  { id: "sky", name: "天空藍", hex: "#56ccf2", rgba: [86, 204, 242, 255] },
  { id: "blue", name: "藍色", hex: "#2d9cdb", rgba: [45, 156, 219, 255] },
  { id: "pink", name: "粉色", hex: "#f781c6", rgba: [247, 129, 198, 255] },
  { id: "brown", name: "咖啡色", hex: "#a06c4c", rgba: [160, 108, 76, 255] },
  { id: "gray", name: "灰色", hex: "#9b9b9b", rgba: [155, 155, 155, 255] },
  { id: "black", name: "黑色", hex: "#2f2f2f", rgba: [47, 47, 47, 255] },
  { id: "white", name: "白色", hex: "#ffffff", rgba: [255, 255, 255, 255] },
] as const;

export const CRAYON_RADIUS = 14;
export const ERASER_RADIUS = 18;
/** 線稿亮度低於此視為「線／牆」，油漆桶不可穿過。 */
export const LINE_LUMA_WALL = 96;

export function hexToRgba(hex: string): Rgba {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export function coloringDraftKey(pageId: string): string {
  return `coloring:v1:${pageId}`;
}

export function lumaAt(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
): number {
  const i = (y * width + x) * 4;
  return (data[i]! * 299 + data[i + 1]! * 587 + data[i + 2]! * 114) / 1000;
}

function colorMatch(
  data: Uint8ClampedArray,
  i: number,
  target: Rgba,
  tolerance: number,
): boolean {
  return (
    Math.abs(data[i]! - target[0]) <= tolerance &&
    Math.abs(data[i + 1]! - target[1]) <= tolerance &&
    Math.abs(data[i + 2]! - target[2]) <= tolerance &&
    Math.abs(data[i + 3]! - target[3]) <= tolerance
  );
}

function writeColor(data: Uint8ClampedArray, i: number, color: Rgba): void {
  data[i] = color[0];
  data[i + 1] = color[1];
  data[i + 2] = color[2];
  data[i + 3] = color[3];
}

/**
 * 在 paint 層做 flood fill；lineData 同尺寸時，暗線視為邊界。
 * 回傳塗到的像素數。
 */
export function floodFillPaint(
  paint: ImageData,
  x: number,
  y: number,
  fill: Rgba,
  lineData?: Uint8ClampedArray,
  tolerance = 24,
): number {
  const { width, height, data } = paint;
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;

  const start = (y * width + x) * 4;
  const target: Rgba = [data[start]!, data[start + 1]!, data[start + 2]!, data[start + 3]!];
  if (
    Math.abs(target[0] - fill[0]) <= 2 &&
    Math.abs(target[1] - fill[1]) <= 2 &&
    Math.abs(target[2] - fill[2]) <= 2 &&
    Math.abs(target[3] - fill[3]) <= 2
  ) {
    return 0;
  }

  const stack: number[] = [x, y];
  let filled = 0;
  const seen = new Uint8Array(width * height);

  while (stack.length > 0) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const idx = cy * width + cx;
    if (seen[idx]) continue;
    seen[idx] = 1;

    if (lineData && lumaAt(lineData, width, cx, cy) < LINE_LUMA_WALL) continue;

    const i = idx * 4;
    if (!colorMatch(data, i, target, tolerance)) continue;

    writeColor(data, i, fill);
    filled += 1;
    stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
  }

  return filled;
}

/** 在 paint 層畫圓點（蠟筆／橡皮擦）。 */
export function stampBrush(
  paint: ImageData,
  x: number,
  y: number,
  radius: number,
  color: Rgba,
  lineData?: Uint8ClampedArray,
): void {
  const { width, height, data } = paint;
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(x - radius));
  const maxX = Math.min(width - 1, Math.ceil(x + radius));
  const minY = Math.max(0, Math.floor(y - radius));
  const maxY = Math.min(height - 1, Math.ceil(y + radius));

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const dx = px - x;
      const dy = py - y;
      if (dx * dx + dy * dy > r2) continue;
      if (lineData && lumaAt(lineData, width, px, py) < LINE_LUMA_WALL) continue;
      writeColor(data, (py * width + px) * 4, color);
    }
  }
}
