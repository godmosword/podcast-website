import type { GameKitGameId, ViewportSize } from "./types";

export const GAMEKIT_VERSION = "0.2.0";

/** 渲染與物理目標幀率。 */
export const TARGET_FPS = 60;

/** 固定時間步進（秒）；物理／邏輯用，與渲染插值分離。 */
export const FIXED_DT = 1 / 120;

/** 單幀最大累積步數，避免 tab 切換後 spiral of death。 */
export const MAX_FRAME_STEPS = 8;

/** 像素畫最大整數放大倍率（避免超大 canvas）。 */
export const MAX_PIXEL_SCALE = 4;

/** 各款 Game Kit 遊戲固定內部解析度。 */
export const GAME_VIEWPORTS: Record<GameKitGameId, ViewportSize> = {
  "block-drop": { width: 200, height: 360 },
  "car-adventure": { width: 320, height: 180 },
};

export function viewportFor(gameId: GameKitGameId): ViewportSize {
  return GAME_VIEWPORTS[gameId];
}
