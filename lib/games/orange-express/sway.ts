/** 前窗隨速度輕晃。只產生 transform 用的數字，最大幾個像素。 */

export const SWAY_MAX_PX = 3;
export const BUMP_PX = 1.6;
/** 每秒衰減的比例：接縫那一下大約 0.2 秒就收掉。 */
export const BUMP_DECAY = 12;

export type Sway = { x: number; y: number; rot: number };

export const NO_SWAY: Sway = { x: 0, y: 0, rot: 0 };

/**
 * t 是秒，speed 0–1，bump 0–1（壓過接縫時設成 1，之後衰減）。
 * 慢的時候幾乎不動，最快時左右約 3px、上下約 2px、旋轉不到 0.3 度。
 */
export function swayAt(t: number, speed: number, bump: number): Sway {
  const s = Math.min(1, Math.max(0, Number.isFinite(speed) ? speed : 0));
  const b = Math.min(1, Math.max(0, Number.isFinite(bump) ? bump : 0));
  if (s <= 0.001 && b <= 0.001) return NO_SWAY;
  const x = Math.sin(t * Math.PI * 2 * 0.7) * SWAY_MAX_PX * s;
  const y = Math.sin(t * Math.PI * 2 * 1.9) * SWAY_MAX_PX * 0.6 * s + b * BUMP_PX;
  const rot = Math.sin(t * Math.PI * 2 * 0.45) * 0.28 * s;
  return {
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    rot: Math.round(rot * 1000) / 1000,
  };
}

export function decayBump(bump: number, dt: number): number {
  const next = bump * Math.exp(-BUMP_DECAY * Math.max(0, dt));
  return next < 0.01 ? 0 : next;
}
