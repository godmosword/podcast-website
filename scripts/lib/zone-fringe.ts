/**
 * zone art magenta fringe 工具（W27-3）：
 * 生圖 chroma-key 只去飽和 magenta，抗鋸齒混色帶會烘進資產成暈圈。
 * 供 fix-forest-zone-art.ts（修復）與 verify-zone-art.ts（迴歸檢查）共用。
 */
import type { BgPredicate } from "./roamer-alpha";

/** 洋紅 fringe 判定：R、B 明顯高於 G（抗鋸齒混色帶也抓得到）。 */
export const isMagentaFringe: BgPredicate = (r, g, b) => r - g > 60 && b - g > 60;

/**
 * despill（仿 scripts/fix-map-art.ts）：僅處理貼透明邊或半透明、
 * 且偏洋紅（min(r,b) > g）的像素，R/B 夾向 G。就地修改 data，回傳處理像素數。
 */
export function despillMagentaEdges(
  data: Buffer | Uint8Array,
  w: number,
  h: number,
  c: number,
): number {
  const isTransparent = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return true;
    return data[(y * w + x) * c + 3]! < 16;
  };
  let touched = 0;
  for (let p = 0; p < w * h; p++) {
    const i = p * c;
    const a = data[i + 3]!;
    if (a < 16) continue;
    const x = p % w;
    const y = (p / w) | 0;
    const onEdge =
      a < 255 ||
      isTransparent(x - 1, y) ||
      isTransparent(x + 1, y) ||
      isTransparent(x, y - 1) ||
      isTransparent(x, y + 1);
    if (!onEdge) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const spill = Math.min(r, b) - g;
    if (spill > 0) {
      data[i] = r - spill;
      data[i + 2] = b - spill;
      touched++;
    }
  }
  return touched;
}
