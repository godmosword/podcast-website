/**
 * 前窗畫布的解析度倍數（PR-I2）。
 * 原本寬度不到 360px 就固定 1 倍：手機前窗反而最糊，跟清楚的介面描邊落差最大（390 寬手機的前窗也常落進去）。
 * 改看畫布總像素：小畫布便宜，可以到 2 倍；大畫布（桌機寬景）照預算往下收，低階手機也不會比原本的桌機重。
 * 預算約是原本桌機 1256×293 在 1.5 倍時的像素量再寬一點。省流量模式維持 1 倍。
 */
export const CANVAS_DPR_CAP = 2;
export const CANVAS_PIXEL_BUDGET = 1_100_000;

export function canvasDpr(cssW: number, cssH: number, deviceRatio: number, saveData = false): number {
  if (saveData || !(deviceRatio > 1)) return 1;
  const area = cssW * cssH;
  // 量不到大小（0、負的、NaN）：照最保守的 1 倍，不冒超出預算的險。
  if (!Number.isFinite(area) || !(area > 0)) return 1;
  const want = Math.min(deviceRatio, CANVAS_DPR_CAP);
  const fit = Math.sqrt(CANVAS_PIXEL_BUDGET / area);
  return Math.max(1, Math.min(want, fit));
}
