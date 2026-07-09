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

type Camera = { scale: number; tx: number; ty: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 夾住鏡頭平移。
 * 舞台放得下時置中；放不下時允許任一舞台點移到 viewport 中心。
 */
export function clampCamera(next: Camera, viewportW: number, viewportH: number): Camera {
  if (viewportW === 0 || viewportH === 0) return next;

  const stageW = MAP_STAGE.width * next.scale;
  const stageH = MAP_STAGE.height * next.scale;

  const tx =
    stageW <= viewportW
      ? (viewportW - stageW) / 2
      : clamp(next.tx, viewportW / 2 - stageW, viewportW / 2);
  const ty =
    stageH <= viewportH
      ? (viewportH - stageH) / 2
      : clamp(next.ty, viewportH / 2 - stageH, viewportH / 2);

  return { scale: next.scale, tx, ty };
}

/** 依 wheel deltaY 計算平滑縮放倍率（clamped）。 */
export function wheelZoomFactor(deltaY: number): number {
  const clamped = Math.max(-120, Math.min(120, deltaY));
  const factor = Math.exp(-clamped * 0.002);
  return Math.min(Math.max(factor, 0.92), 1.08);
}

/** 拖曳判定門檻（像素）：指標移動未超過此距離視為點擊、不啟動平移。 */
export const DRAG_SLOP_PX = 8;

/** 判斷指標位移是否已越過拖曳門檻（用平方比較避免開根號）。 */
export function exceedsDragSlop(
  dx: number,
  dy: number,
  slop: number = DRAG_SLOP_PX,
): boolean {
  return dx * dx + dy * dy >= slop * slop;
}

/** 慣性甩動的起始最低速度（px/ms）；放手時低於此不觸發慣性。 */
export const MIN_FLING_SPEED = 0.05;

/** 慣性停止速度（px/ms）；衰減到此以下即停止動畫。 */
export const INERTIA_STOP_SPEED = 0.008;

/** 慣性衰減時間常數（ms）：速度每經過此毫秒數衰減為 1/e，數值越大滑得越遠。 */
export const INERTIA_DECAY_TAU = 325;

/** 速度取樣的指數平滑係數（0–1，越大越偏向最新的瞬時速度）。 */
export const VELOCITY_BLEND_ALPHA = 0.4;

/** 放手前的靜止判定（ms）：距最後一次移動超過此時間視為停住，不甩動。 */
export const VELOCITY_IDLE_RESET_MS = 80;

/** 依經過時間對速度做指數衰減（時間無關於幀率，長短幀一致）。 */
export function decayVelocity(
  v: number,
  dtMs: number,
  tau: number = INERTIA_DECAY_TAU,
): number {
  return v * Math.exp(-dtMs / tau);
}

/** 指數平滑混合速度取樣：回傳 prev 與 instant 的加權值（alpha 偏向 instant）。 */
export function blendVelocity(
  prev: number,
  instant: number,
  alpha: number = VELOCITY_BLEND_ALPHA,
): number {
  return prev * (1 - alpha) + instant * alpha;
}
