import { MAP_STAGE } from "@/data/universe-zones";

/** 鏡頭縮放下限（zoom-out 到底）。 */
export const MIN_SCALE = 0.34;

/** 鏡頭縮放上限（zoom-in 到底）。 */
export const MAX_SCALE = 2.4;

/** 預設鏡頭比 fit 再退一點，讓島群不貼視窗邊、保留拖曳呼吸感。 */
export const FIT_MARGIN = 0.88;

/** 把 scale 夾在 MIN_SCALE–MAX_SCALE。 */
export function clampScale(scale: number): number {
  return Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);
}

/** 依 viewport 尺寸算預設 contain-fit 鏡頭倍率（含 FIT_MARGIN 與 clamp）。 */
export function fitScaleFor(w: number, h: number): number {
  if (w === 0 || h === 0) return 1;
  return clampScale(
    Math.min(w / MAP_STAGE.width, h / MAP_STAGE.height) * FIT_MARGIN,
  );
}

/**
 * 海面滿版外擴量（stage 座標單位）。
 * 需求：任何相機狀態下海面貼圖都要蓋滿視窗。worst case = MIN_SCALE 0.34 ×
 * 5120px 寬螢幕 ⇒ 單側需 (5120/0.34 − MAP_STAGE.width)/2 ≈ 7030；取 7200 兩軸共用。
 * 貼圖 pattern 為 userSpaceOnUse，外擴 rect 貼圖無縫延續；raster 以可視區裁切，
 * rect 幾何大小近乎免費。
 */
export const SEA_BLEED = 7200;

/** 點擊縮放：位移低於此值視為 tap（非拖曳）。 */
const TAP_DRAG_THRESHOLD_PX = 6;

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
