/**
 * 著色本「參考彩圖」純函式（免 API）：把線稿切成封閉區塊，
 * 從原圖對位取色，再收斂成色盤上的顏色，讓小朋友照著塗得出來。
 */
import { COLORING_PALETTE, LINE_LUMA_WALL } from "../../lib/coloring/tools";

export type PaletteId = (typeof COLORING_PALETTE)[number]["id"];

export type RegionMap = {
  /** 每個像素所屬區塊；線（牆）為 -1。 */
  label: Int32Array;
  count: number;
  size: number;
};

/** 線稿座標 → 原圖座標：以畫面中心縮放後平移（皆為 0–1 比例）。 */
export type Alignment = { scale: number; dx: number; dy: number };

/** 人工修色：點 (x, y)（0–1）所在的區塊改塗指定色。 */
export type ReferenceOverride = {
  at: readonly [number, number];
  color: PaletteId;
};

/** 單頁修色配方：先整頁換色，再逐點修。 */
export type ReferenceRecipe = {
  /** 指定取色來源（相對於 public/）；省略時在原圖與定裝照中挑對位最好的。 */
  source?: string;
  /** 自動取色系統性偏差時整頁換色（例如黃車被收成橘色）。 */
  remap?: Readonly<Partial<Record<PaletteId, PaletteId>>>;
  paint?: readonly ReferenceOverride[];
};

const IDENTITY: Alignment = { scale: 1, dx: 0, dy: 0 };
const MIN_SAMPLES = 4;
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.2;
const MAX_SHIFT = 0.14;

function luma(rgb: Uint8Array, p: number): number {
  return 0.299 * rgb[p * 3]! + 0.587 * rgb[p * 3 + 1]! + 0.114 * rgb[p * 3 + 2]!;
}

/** 4 連通標記非線像素；size×size RGB。 */
export function labelRegions(line: Uint8Array, size: number): RegionMap {
  const total = size * size;
  const label = new Int32Array(total).fill(-1);
  const wall = new Uint8Array(total);
  for (let p = 0; p < total; p++) wall[p] = luma(line, p) < LINE_LUMA_WALL ? 1 : 0;
  const stack = new Int32Array(total);
  let count = 0;
  for (let seed = 0; seed < total; seed++) {
    if (label[seed] !== -1 || wall[seed]) continue;
    let top = 0;
    stack[top++] = seed;
    label[seed] = count;
    while (top > 0) {
      const p = stack[--top]!;
      const x = p % size;
      const neighbours = [
        x > 0 ? p - 1 : -1,
        x < size - 1 ? p + 1 : -1,
        p - size,
        p + size < total ? p + size : -1,
      ];
      for (const q of neighbours) {
        if (q < 0 || label[q] !== -1 || wall[q]) continue;
        label[q] = count;
        stack[top++] = q;
      }
    }
    count++;
  }
  return { label, count, size };
}

export function mapPixel(p: number, size: number, a: Alignment): number {
  const x = p % size;
  const y = (p - x) / size;
  const sx = Math.round(((x / size - 0.5) * a.scale + 0.5 + a.dx) * size);
  const sy = Math.round(((y / size - 0.5) * a.scale + 0.5 + a.dy) * size);
  if (sx < 0 || sy < 0 || sx >= size || sy >= size) return -1;
  return sy * size + sx;
}

/** 對位品質：各區塊內原圖顏色的平均變異數（越小越貼合）。 */
export function alignmentCost(
  regions: RegionMap,
  source: Uint8Array,
  a: Alignment,
): number {
  const { label, count, size } = regions;
  const acc = new Float64Array(count * 7);
  for (let p = 0; p < size * size; p++) {
    const id = label[p]!;
    if (id < 0) continue;
    const q = mapPixel(p, size, a);
    if (q < 0) continue;
    const o = id * 7;
    for (let c = 0; c < 3; c++) {
      const v = source[q * 3 + c]!;
      acc[o + c] += v;
      acc[o + 3 + c] += v * v;
    }
    acc[o + 6] += 1;
  }
  let variance = 0;
  let samples = 0;
  for (let i = 0; i < count; i++) {
    const o = i * 7;
    const n = acc[o + 6]!;
    if (n < MIN_SAMPLES) continue;
    for (let c = 0; c < 3; c++) variance += acc[o + 3 + c]! - acc[o + c]! ** 2 / n;
    samples += n;
  }
  return variance / Math.max(1, samples);
}

/** 粗格搜尋縮放＋平移；線稿是 AI 重繪，主體位置與原圖常有落差。 */
export function findAlignment(
  regions: RegionMap,
  source: Uint8Array,
): { alignment: Alignment; cost: number } {
  let best = IDENTITY;
  let bestCost = alignmentCost(regions, source, IDENTITY);
  // 搜尋範圍刻意收窄：放太寬會把線稿擠進原圖單色角落，假性降低變異數。
  for (let scale = MIN_SCALE; scale <= MAX_SCALE + 1e-9; scale += 0.04)
    for (let dx = -MAX_SHIFT; dx <= MAX_SHIFT + 1e-9; dx += 0.02)
      for (let dy = -MAX_SHIFT; dy <= MAX_SHIFT + 1e-9; dy += 0.02) {
        const a = { scale, dx, dy };
        const cost = alignmentCost(regions, source, a);
        if (cost < bestCost) [bestCost, best] = [cost, a];
      }
  return { alignment: best, cost: bestCost };
}

/** 每區塊取「最常見色桶」的平均色；取不到樣本回 null。 */
export function sampleRegionColors(
  regions: RegionMap,
  source: Uint8Array,
  a: Alignment,
): (readonly [number, number, number] | null)[] {
  const { label, count, size } = regions;
  const bucketOf = (q: number) =>
    ((source[q * 3]! >> 5) << 6) |
    ((source[q * 3 + 1]! >> 5) << 3) |
    (source[q * 3 + 2]! >> 5);
  const hist = Array.from({ length: count }, () => new Map<number, number>());
  for (let p = 0; p < size * size; p++) {
    const id = label[p]!;
    const q = id < 0 ? -1 : mapPixel(p, size, a);
    if (q < 0) continue;
    const k = bucketOf(q);
    hist[id]!.set(k, (hist[id]!.get(k) ?? 0) + 1);
  }
  const modal = hist.map((h) => {
    let best = -1;
    let key = -1;
    for (const [k, n] of h) if (n > best) [best, key] = [n, k];
    return key;
  });
  const sum = new Float64Array(count * 4);
  for (let p = 0; p < size * size; p++) {
    const id = label[p]!;
    const q = id < 0 ? -1 : mapPixel(p, size, a);
    if (q < 0 || bucketOf(q) !== modal[id]) continue;
    for (let c = 0; c < 3; c++) sum[id * 4 + c] += source[q * 3 + c]!;
    sum[id * 4 + 3] += 1;
  }
  return Array.from({ length: count }, (_, id) => {
    const n = sum[id * 4 + 3]!;
    if (!n) return null;
    return [sum[id * 4]! / n, sum[id * 4 + 1]! / n, sum[id * 4 + 2]! / n] as const;
  });
}

function toOklab([r, g, b]: readonly [number, number, number]) {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ] as const;
}

type Lch = { L: number; C: number; h: number };

function toOklch(rgb: readonly [number, number, number]): Lch {
  const [L, a, b] = toOklab(rgb);
  return { L, C: Math.hypot(a, b), h: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360 };
}

const NEUTRAL: ReadonlySet<PaletteId> = new Set(["white", "gray", "black"]);
const CHROMATIC = COLORING_PALETTE.filter((s) => !NEUTRAL.has(s.id as PaletteId)).map(
  (s) => ({ id: s.id as PaletteId, lch: toOklch([s.rgba[0], s.rgba[1], s.rgba[2]]) }),
);
/** 低於此彩度視為無彩（白／灰／黑）。 */
const NEUTRAL_CHROMA = 0.05;
/** 很亮又不太飽和（米白、奶油色）一律當白色，車身才不會變橘。 */
const CREAM = { L: 0.84, C: 0.08 };
const DARK_L = 0.42;
const HUE_STEP = 30;
const LIGHTNESS_STEP = 0.12;

function hueGap(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * 收斂到色盤：色相優先，再看明度。
 * 深藍警車要收成藍色（不是黑色），深土色收成咖啡色。
 */
export function snapToPalette(rgb: readonly [number, number, number]): PaletteId {
  const { L, C, h } = toOklch(rgb);
  if (C < NEUTRAL_CHROMA) return L >= 0.82 ? "white" : L >= 0.5 ? "gray" : "black";
  if (L >= CREAM.L && C < CREAM.C) return "white";
  const lightness = L < DARK_L ? Math.max(L, 0.6) : L;
  let best: PaletteId = "gray";
  let bestD = Infinity;
  for (const { id, lch } of CHROMATIC) {
    const d =
      (hueGap(h, lch.h) / HUE_STEP) ** 2 + ((lightness - lch.L) / LIGHTNESS_STEP) ** 2;
    if (d < bestD) [bestD, best] = [d, id];
  }
  return best;
}

export function paletteRgb(id: PaletteId): readonly [number, number, number] {
  const swatch = COLORING_PALETTE.find((s) => s.id === id)!;
  return [swatch.rgba[0], swatch.rgba[1], swatch.rgba[2]];
}

function regionAt(regions: RegionMap, at: readonly [number, number]): number {
  const { label, size } = regions;
  const cx = Math.round(at[0] * (size - 1));
  const cy = Math.round(at[1] * (size - 1));
  for (let r = 0; r <= 6; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const id = label[y * size + x]!;
        if (id >= 0) return id;
      }
  throw new Error(`修色點 (${at.join(", ")}) 附近沒有可塗區塊`);
}

/** 套修色配方；點落在線上時就近找 6px 內的區塊。 */
export function applyRecipe(
  colors: readonly (PaletteId | null)[],
  regions: RegionMap,
  recipe: ReferenceRecipe,
): (PaletteId | null)[] {
  const remap = recipe.remap ?? {};
  const next = colors.map((c) => (c ? (remap[c] ?? c) : c));
  const painted = new Map<number, ReferenceOverride>();
  for (const override of recipe.paint ?? []) {
    const id = regionAt(regions, override.at);
    const earlier = painted.get(id);
    // 兩個修色點落在同一區塊卻要不同色，通常是點歪到背景；直接擋下免得整片塗錯。
    if (earlier && earlier.color !== override.color) {
      throw new Error(
        `修色點 (${override.at.join(", ")}) 與 (${earlier.at.join(", ")}) 在同一區塊卻要不同顏色`,
      );
    }
    painted.set(id, override);
    next[id] = override.color;
  }
  return next;
}

/** 合成：區塊填色後再乘上線稿，保留線條反鋸齒。 */
export function renderReference(
  line: Uint8Array,
  regions: RegionMap,
  colors: readonly (PaletteId | null)[],
): Uint8Array {
  const { label, size } = regions;
  const out = new Uint8Array(size * size * 3);
  const rgb = colors.map((id) => (id ? paletteRgb(id) : null));
  for (let p = 0; p < size * size; p++) {
    const id = label[p]!;
    const fill = id < 0 ? null : rgb[id];
    for (let c = 0; c < 3; c++) {
      const ink = line[p * 3 + c]!;
      out[p * 3 + c] = fill ? Math.round((fill[c]! * ink) / 255) : ink;
    }
  }
  return out;
}
