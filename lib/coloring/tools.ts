/** 著色畫布純函式：油漆桶、筆刷、dirty-rect、顏色常數、草稿 key。 */

export type Rgba = readonly [number, number, number, number];

export type ColoringTool = "crayon" | "bucket" | "eraser";

/** 實際觸及的像素範圍（canvas 座標，含端點）。 */
export type DirtyRect = { x: number; y: number; width: number; height: number };

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

/** 筆刷三檔；radius 以「螢幕顯示像素」為準，落筆時依畫布縮放換算成 canvas px。 */
export const BRUSH_SIZES: readonly {
  id: string;
  name: string;
  displayRadius: number;
}[] = [
  { id: "small", name: "細", displayRadius: 5 },
  { id: "medium", name: "中", displayRadius: 10 },
  { id: "large", name: "粗", displayRadius: 18 },
] as const;

export type BrushSizeId = (typeof BRUSH_SIZES)[number]["id"];

/** 橡皮擦比同檔蠟筆略粗，好擦乾淨。 */
export const ERASER_RADIUS_BONUS = 4;
/** 線稿亮度低於此視為「線／牆」，油漆桶不可穿過。 */
export const LINE_LUMA_WALL = 96;
/** 油漆桶填完後，顏色向線稿暗區滲入的深度（px）；消除抗鋸齒白邊縫隙。 */
export const FILL_BLEED_PX = 2;

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

/** 累計 dirty rect（就地擴張）。 */
type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function expandBounds(b: Bounds, x: number, y: number): void {
  if (x < b.minX) b.minX = x;
  if (y < b.minY) b.minY = y;
  if (x > b.maxX) b.maxX = x;
  if (y > b.maxY) b.maxY = y;
}

function boundsToRect(b: Bounds): DirtyRect | null {
  if (b.minX > b.maxX || b.minY > b.maxY) return null;
  return {
    x: b.minX,
    y: b.minY,
    width: b.maxX - b.minX + 1,
    height: b.maxY - b.minY + 1,
  };
}

/** 合併兩個 dirty rect（任一為 null 則回傳另一個）。 */
export function unionDirtyRect(
  a: DirtyRect | null,
  b: DirtyRect | null,
): DirtyRect | null {
  if (!a) return b;
  if (!b) return a;
  const minX = Math.min(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxX = Math.max(a.x + a.width, b.x + b.width);
  const maxY = Math.max(a.y + a.height, b.y + b.height);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** 從 ImageData 裁出 rect 區塊（undo 補丁用，記憶體只佔 rect 大小）。 */
export function cropImageDataRect(
  source: ImageData,
  rect: DirtyRect,
): Uint8ClampedArray<ArrayBuffer> {
  const { width } = source;
  const out = new Uint8ClampedArray(rect.width * rect.height * 4);
  for (let row = 0; row < rect.height; row += 1) {
    const srcStart = ((rect.y + row) * width + rect.x) * 4;
    out.set(
      source.data.subarray(srcStart, srcStart + rect.width * 4),
      row * rect.width * 4,
    );
  }
  return out;
}

/** 把裁出的補丁貼回 ImageData 的 rect 位置（undo 還原用）。 */
export function pasteImageDataRect(
  dest: ImageData,
  patch: Uint8ClampedArray,
  rect: DirtyRect,
): void {
  const { width } = dest;
  for (let row = 0; row < rect.height; row += 1) {
    const destStart = ((rect.y + row) * width + rect.x) * 4;
    dest.data.set(
      patch.subarray(row * rect.width * 4, (row + 1) * rect.width * 4),
      destStart,
    );
  }
}

export type FloodFillResult = { filled: number; rect: DirtyRect | null };

/**
 * 在 paint 層做 flood fill；lineData 同尺寸時，暗線視為邊界。
 * 填完後顏色向線稿暗區滲入 FILL_BLEED_PX（線稿以 multiply 疊上，
 * 滲入處不可見，但消除抗鋸齒邊緣的白縫）。回傳塗到的像素數與 dirty rect。
 */
export function floodFillPaint(
  paint: ImageData,
  x: number,
  y: number,
  fill: Rgba,
  lineData?: Uint8ClampedArray,
  tolerance = 24,
): FloodFillResult {
  const { width, height, data } = paint;
  if (x < 0 || y < 0 || x >= width || y >= height) {
    return { filled: 0, rect: null };
  }

  const start = (y * width + x) * 4;
  const target: Rgba = [data[start]!, data[start + 1]!, data[start + 2]!, data[start + 3]!];
  if (colorMatch(data, start, fill, 2)) {
    return { filled: 0, rect: null };
  }

  const stack: number[] = [x, y];
  let filled = 0;
  const seen = new Uint8Array(width * height);
  const bounds: Bounds = { minX: x, minY: y, maxX: x, maxY: y };
  /** 被暗線擋下的邊界像素，供第二階段滲入。 */
  const edge: number[] = [];

  while (stack.length > 0) {
    const cy = stack.pop()!;
    const cx = stack.pop()!;
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const idx = cy * width + cx;
    if (seen[idx]) continue;
    seen[idx] = 1;

    if (lineData && lumaAt(lineData, width, cx, cy) < LINE_LUMA_WALL) {
      edge.push(cx, cy, 1);
      continue;
    }

    const i = idx * 4;
    if (!colorMatch(data, i, target, tolerance)) continue;

    writeColor(data, i, fill);
    filled += 1;
    expandBounds(bounds, cx, cy);
    stack.push(cx + 1, cy, cx - 1, cy, cx, cy + 1, cx, cy - 1);
  }

  // 第二階段：向暗線內滲入（深度限制 BFS），封住抗鋸齒白縫。
  if (lineData && filled > 0) {
    while (edge.length > 0) {
      const depth = edge.pop()!;
      const cy = edge.pop()!;
      const cx = edge.pop()!;
      if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
      if (lumaAt(lineData, width, cx, cy) >= LINE_LUMA_WALL) continue;
      const idx = cy * width + cx;
      if (seen[idx] === 2) continue;
      seen[idx] = 2;
      writeColor(data, idx * 4, fill);
      expandBounds(bounds, cx, cy);
      if (depth < FILL_BLEED_PX) {
        edge.push(
          cx + 1, cy, depth + 1,
          cx - 1, cy, depth + 1,
          cx, cy + 1, depth + 1,
          cx, cy - 1, depth + 1,
        );
      }
    }
  }

  return { filled, rect: filled > 0 ? boundsToRect(bounds) : null };
}

/** 在 paint 層畫圓點（蠟筆／橡皮擦）；回傳實際寫入的 dirty rect。 */
export function stampBrush(
  paint: ImageData,
  x: number,
  y: number,
  radius: number,
  color: Rgba,
  lineData?: Uint8ClampedArray,
): DirtyRect | null {
  const { width, height, data } = paint;
  const r2 = radius * radius;
  const minX = Math.max(0, Math.floor(x - radius));
  const maxX = Math.min(width - 1, Math.ceil(x + radius));
  const minY = Math.max(0, Math.floor(y - radius));
  const maxY = Math.min(height - 1, Math.ceil(y + radius));
  const bounds: Bounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  for (let py = minY; py <= maxY; py += 1) {
    for (let px = minX; px <= maxX; px += 1) {
      const dx = px - x;
      const dy = py - y;
      if (dx * dx + dy * dy > r2) continue;
      if (lineData && lumaAt(lineData, width, px, py) < LINE_LUMA_WALL) continue;
      writeColor(data, (py * width + px) * 4, color);
      expandBounds(bounds, px, py);
    }
  }

  return boundsToRect(bounds);
}
