/** 黏土海面貼圖平鋪尺寸（stage 單位）；與 UniverseMap 視覺等價。 */
export const SEA_TILE = 300;

/** 近景雲層視差係數（對齊 UniverseMapParallax）。 */
export const PARALLAX_NEAR = 1.15;

/**
 * 遠景天象（日月／水面月光）視差係數。< 1 ⇒ 比世界移動得少 ⇒ 讀作遠。
 * 刻意極小並另加位移上限：地圖世界可平移數千 px，係數只要稍大，
 * 月亮就會整顆離開視窗（連帶水面月光失去光源），夜間反而更糟。
 */
export const PARALLAX_FAR = 0.06;

/** 遠景天象位移上限（px）：只給「天空沒完全跟上」的線索，不讓日月跑掉。 */
export const SKY_MAX_DRIFT = 26;

function clampDrift(v: number): number {
  return Math.max(-SKY_MAX_DRIFT, Math.min(SKY_MAX_DRIFT, v));
}

/**
 * 遠景天象層 transform。日月與水面月光共用同一組位移，兩者才會維持對齊
 * （月光帶必須看起來是那顆月亮打下來的）。
 */
export function applySkyCamera(
  el: HTMLElement | null,
  cam: CameraPose,
  meta: CameraVisualMeta,
): void {
  if (!el) return;
  if (meta.reducedMotion) {
    el.style.transform = "none";
    el.style.transition = "none";
    return;
  }
  const dx = clampDrift(cam.tx * PARALLAX_FAR);
  const dy = clampDrift(cam.ty * PARALLAX_FAR);
  el.style.transform = `translate(${dx}px, ${dy}px)`;
  el.style.transition = meta.isAnimating
    ? `transform ${meta.flyDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
    : "none";
}

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
