/** 參考彩圖取色：彩圖只用色盤 12 色，點哪裡就換成那塊的顏色。 */
import { COLORING_PALETTE } from "./tools";

/** 線條與反鋸齒邊緣（比色盤黑色 #2f2f2f 還暗）不算顏色。 */
const LINE_INK_LUMA = 36;
const SAMPLE_RADIUS = 3;

function nearestSwatch(r: number, g: number, b: number): number {
  let best = 0;
  let bestD = Infinity;
  COLORING_PALETTE.forEach(({ rgba }, i) => {
    const d = (r - rgba[0]) ** 2 + (g - rgba[1]) ** 2 + (b - rgba[2]) ** 2;
    if (d < bestD) [bestD, best] = [d, i];
  });
  return best;
}

/**
 * 以 (x, y) 為中心取 7×7 投票，略過線條像素；全是線時回 null。
 * x、y 為圖片像素座標。
 */
export function pickPaletteHex(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): string | null {
  const votes = new Array<number>(COLORING_PALETTE.length).fill(0);
  const cx = Math.round(x);
  const cy = Math.round(y);
  for (let dy = -SAMPLE_RADIUS; dy <= SAMPLE_RADIUS; dy++)
    for (let dx = -SAMPLE_RADIUS; dx <= SAMPLE_RADIUS; dx++) {
      const px = cx + dx;
      const py = cy + dy;
      if (px < 0 || py < 0 || px >= width || py >= height) continue;
      const o = (py * width + px) * 4;
      const [r, g, b] = [data[o]!, data[o + 1]!, data[o + 2]!];
      if (0.299 * r + 0.587 * g + 0.114 * b < LINE_INK_LUMA) continue;
      votes[nearestSwatch(r, g, b)] += 1;
    }
  const top = Math.max(...votes);
  return top > 0 ? COLORING_PALETTE[votes.indexOf(top)]!.hex : null;
}

/** 色盤色的中文名，給「換成○○了」的提示用。 */
export function paletteName(hex: string): string {
  return (
    COLORING_PALETTE.find((s) => s.hex.toLowerCase() === hex.toLowerCase())?.name ??
    "這個顏色"
  );
}
