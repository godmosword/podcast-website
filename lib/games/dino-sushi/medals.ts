/**
 * 《多多壽司屋》星星。medal bit 是存檔相容性契約，改條件前要想清楚：
 * bit0 cleared＝送完 5 單；bit1 flawless＝至少 3 單一次做對；bit2 collectedAll＝5 單都一次做對。
 */

import { ORDERS_PER_ROUND } from "./orders";

/** 只有一關：這款遊戲終身最多 3 星，重玩不能再多拿。 */
export const DINO_SUSHI_LEVEL_INDEX = 0;
const FLAWLESS_MIN_FIRST_TRY = 3;

export type RoundMedals = {
  cleared: boolean;
  flawless: boolean;
  collectedAll: boolean;
  firstTryCount: number;
};

/** firstTries[i]＝第 i 單是否一次做對。 */
export function roundMedals(firstTries: readonly boolean[]): RoundMedals {
  const firstTryCount = firstTries.filter(Boolean).length;
  const cleared = firstTries.length >= ORDERS_PER_ROUND;
  return {
    cleared,
    flawless: cleared && firstTryCount >= FLAWLESS_MIN_FIRST_TRY,
    collectedAll: cleared && firstTryCount >= ORDERS_PER_ROUND,
    firstTryCount,
  };
}
