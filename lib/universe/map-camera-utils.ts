/** 點擊縮放：位移低於此值視為 tap（非拖曳）。 */
export const TAP_DRAG_THRESHOLD_PX = 6;

export const CLICK_ZOOM_IN_FACTOR = 1.15;

export const CLICK_ZOOM_OUT_FACTOR = 1 / CLICK_ZOOM_IN_FACTOR;

/** 判斷 pointer 位移是否已超過 tap 門檻。 */
export function pointerTravelExceeded(
  dx: number,
  dy: number,
  threshold = TAP_DRAG_THRESHOLD_PX,
): boolean {
  return Math.hypot(dx, dy) >= threshold;
}

/** 依 wheel deltaY 計算平滑縮放倍率（clamped）。 */
export function wheelZoomFactor(deltaY: number): number {
  const clamped = Math.max(-120, Math.min(120, deltaY));
  const factor = Math.exp(-clamped * 0.002);
  return Math.min(Math.max(factor, 0.92), 1.08);
}
