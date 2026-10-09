/** 《繽紛樂園》計分、速度與自由堆疊難度數值（原樣搬自 BlockDropView）。 */

import type { BlockDropDifficultyPreference } from "@/lib/progress-store";

export const LINE_SCORE = [0, 100, 300, 500, 800] as const;
const LOCK_DELAY = 450;
export const DAS_DELAY = 170;
export const DAS_REPEAT = 50;
/** 軟降（按住往下／快落）每格毫秒。 */
export const SOFT_DROP_MS = 45;
/** 鎖定延遲內最多重置次數。 */
export const LOCK_RESET_LIMIT = 15;
/** 消排閃光動畫時長（期間不吃輸入、不累積重力）。 */
export const CLEAR_ANIM_MS = 260;
/** 自由堆疊：每 10 排升一級。 */
export const LINES_PER_LEVEL = 10;

export const gravityMs = (level: number): number => Math.max(70, 800 - (level - 1) * 70);

export type FreeDifficultyNumbers = {
  gravityScale: number;
  lockDelayMs: number;
  scoreMultiplier: number;
  rescueLimit: number;
};

export const FREE_DIFFICULTY: Record<BlockDropDifficultyPreference, FreeDifficultyNumbers> = {
  relaxed: { gravityScale: 1.35, lockDelayMs: 620, scoreMultiplier: 1, rescueLimit: 1 },
  standard: { gravityScale: 1, lockDelayMs: LOCK_DELAY, scoreMultiplier: 1, rescueLimit: 0 },
  challenge: { gravityScale: 0.82, lockDelayMs: 360, scoreMultiplier: 1.35, rescueLimit: 0 },
};
