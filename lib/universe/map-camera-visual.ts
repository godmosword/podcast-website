/** 黏土海面貼圖平鋪尺寸（stage 單位）；與 UniverseMap 視覺等價。 */
export const SEA_TILE = 300;

/** 近景雲層視差係數（對齊 UniverseMapParallax）。 */
export const PARALLAX_NEAR = 1.15;

export type CameraPose = { scale: number; tx: number; ty: number };

export type CameraVisualMeta = {
  isAnimating: boolean;
  flyDurationMs: number;
  reducedMotion: boolean;
};

/** 舞台 transform 與標籤反縮放 CSS 變數。 */
export function applyStageCamera(
  el: HTMLElement | null,
  cam: CameraPose,
  meta: CameraVisualMeta,
): void {
  if (!el) return;
  el.style.transform = `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.scale})`;
  el.style.setProperty("--map-scale", String(cam.scale));
  el.style.setProperty(
    "--label-offset-y",
    cam.scale < 0.5 ? "-140px" : "6px",
  );
  el.style.transition = meta.isAnimating
    ? `transform ${meta.flyDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : "none";
}

/** screen-space 海面：background-size／position 跟隨鏡頭。 */
export function applySeaCamera(
  el: HTMLElement | null,
  cam: CameraPose,
  meta: CameraVisualMeta,
  seaTile: number = SEA_TILE,
): void {
  if (!el) return;
  el.style.backgroundSize = `${seaTile * cam.scale}px ${seaTile * cam.scale}px`;
  el.style.backgroundPosition = `${cam.tx}px ${cam.ty}px`;
  const fly = meta.isAnimating
    ? `background-position ${meta.flyDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1), ` +
      `background-size ${meta.flyDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : "none";
  // 夜海另有 opacity transition；呼叫端可再覆寫。
  el.style.transition = fly;
}

/** 近景雲層視差 transform。 */
export function applyParallaxCamera(
  el: HTMLElement | null,
  cam: CameraPose,
  meta: CameraVisualMeta,
): void {
  if (!el) return;
  const factor = meta.reducedMotion ? 1 : PARALLAX_NEAR;
  const pScale = meta.reducedMotion
    ? cam.scale
    : 1 + (cam.scale - 1) * PARALLAX_NEAR;
  el.style.transform = `translate(${cam.tx * factor}px, ${cam.ty * factor}px) scale(${pScale})`;
  el.style.transition = meta.isAnimating
    ? `transform ${meta.flyDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : "none";
}
