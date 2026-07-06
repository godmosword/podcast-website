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
