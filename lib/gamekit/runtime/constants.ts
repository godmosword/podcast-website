export const GAMEKIT_PROGRESS_EVENT = "cheche:gamekit-progress";

/** 渲染與物理目標幀率。 */
export const TARGET_FPS = 60;

/** 固定時間步進（秒）；物理／邏輯用，與渲染插值分離。 */
export const FIXED_DT = 1 / 120;

/** 單幀最大累積步數，避免 tab 切換後 spiral of death。 */
export const MAX_FRAME_STEPS = 8;
