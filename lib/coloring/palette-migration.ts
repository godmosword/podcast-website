/**
 * #206 之前的飽和色票 → 現在的粉彩色票。
 * 參考彩圖重上色與 localStorage 選色共用這張表，不用 RGB 最近距離猜。
 * 白兩邊相同。IndexedDB 草稿像素不走這張表。
 */
import { COLORING_PALETTE } from "./tools";

export const LEGACY_COLORING_PALETTE: readonly {
  id: string;
  hex: string;
  rgb: readonly [number, number, number];
}[] = [
  { id: "red", hex: "#e85d4c", rgb: [232, 93, 76] },
  { id: "orange", hex: "#f4a261", rgb: [244, 162, 97] },
  { id: "yellow", hex: "#f2c94c", rgb: [242, 201, 76] },
  { id: "lime", hex: "#6fcf97", rgb: [111, 207, 151] },
  { id: "green", hex: "#27ae60", rgb: [39, 174, 96] },
  { id: "sky", hex: "#56ccf2", rgb: [86, 204, 242] },
  { id: "blue", hex: "#2d9cdb", rgb: [45, 156, 219] },
  { id: "pink", hex: "#f781c6", rgb: [247, 129, 198] },
  { id: "brown", hex: "#a06c4c", rgb: [160, 108, 76] },
  { id: "gray", hex: "#9b9b9b", rgb: [155, 155, 155] },
  { id: "black", hex: "#2f2f2f", rgb: [47, 47, 47] },
  { id: "white", hex: "#ffffff", rgb: [255, 255, 255] },
];

/** 舊 hex（小寫）→ 同 id 的新 hex。 */
export const LEGACY_TO_CURRENT_HEX: Readonly<Record<string, string>> = Object.fromEntries(
  LEGACY_COLORING_PALETTE.map((legacy) => {
    const current = COLORING_PALETTE.find((swatch) => swatch.id === legacy.id);
    if (!current) throw new Error(`舊色票 ${legacy.id} 沒有對應的新色`);
    return [legacy.hex, current.hex];
  }),
);

/**
 * 已在粉彩色票內就原樣（小寫）。
 * 對得上舊色票就換成新色。格式不對、或兩邊都不是，回 null，由呼叫端退回預設色。
 */
export function migratePaletteHex(hex: string): string | null {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return null;
  const key = hex.toLowerCase();
  if (COLORING_PALETTE.some((swatch) => swatch.hex === key)) return key;
  return LEGACY_TO_CURRENT_HEX[key] ?? null;
}

/** 比色盤黑色還暗的線條，重上色時留著。與 reference-pick 的 LINE_INK_LUMA 相同。 */
const LINE_INK_LUMA = 36;

/**
 * 舊彩圖 webp 壓縮後，離舊色票仍在這個平方距離內才換色。
 * 再遠的是抗鋸齒混色，不動。
 */
export const LEGACY_RECOLOR_MAX_DISTANCE_SQ = 900;

function distanceSq(
  r: number,
  g: number,
  b: number,
  rgb: readonly [number, number, number],
): number {
  return (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
}

/**
 * 把一顆舊彩圖像素換成同 id 的粉彩。
 * 已經更靠近新色票的像素留著（腳本可以重跑）。
 * 線條與離兩套色票都很遠的混色留著。
 */
export function recolorLegacyPixel(
  r: number,
  g: number,
  b: number,
): readonly [number, number, number] {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  if (luma < LINE_INK_LUMA) return [r, g, b];

  let legacyIndex = 0;
  let legacyDistance = Infinity;
  LEGACY_COLORING_PALETTE.forEach((swatch, index) => {
    const distance = distanceSq(r, g, b, swatch.rgb);
    if (distance < legacyDistance) {
      legacyDistance = distance;
      legacyIndex = index;
    }
  });

  let currentDistance = Infinity;
  COLORING_PALETTE.forEach((swatch) => {
    const distance = distanceSq(r, g, b, [swatch.rgba[0], swatch.rgba[1], swatch.rgba[2]]);
    if (distance < currentDistance) currentDistance = distance;
  });

  if (currentDistance <= legacyDistance) return [r, g, b];
  if (legacyDistance > LEGACY_RECOLOR_MAX_DISTANCE_SQ) return [r, g, b];

  const id = LEGACY_COLORING_PALETTE[legacyIndex]!.id;
  const next = COLORING_PALETTE.find((swatch) => swatch.id === id)!;
  return [next.rgba[0], next.rgba[1], next.rgba[2]];
}
