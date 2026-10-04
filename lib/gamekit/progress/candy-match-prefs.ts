/**
 * 消消樂專用偏好：玩法（輕鬆／挑戰）與首次引導是否看過。
 * 存在 GameKit 統一設定（preferences.gameKit），不改其他遊戲的兒童模式。
 */

import {
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
  type CandyMatchTipId,
} from "@/lib/progress-store";
import type { CandyMode } from "@/lib/games/candy-match/stages";

export type { CandyMatchTipId };

export type CandyMatchPrefs = {
  /** null＝尚未選過 */
  mode: CandyMode | null;
  tipsSeen: readonly CandyMatchTipId[];
};

const EMPTY_PREFS: CandyMatchPrefs = { mode: null, tipsSeen: [] };

export function loadCandyMatchPrefs(): CandyMatchPrefs {
  if (typeof window === "undefined") return EMPTY_PREFS;
  try {
    const stored = getGameKitSettingsFromStore();
    return { mode: stored.candyMatchMode, tipsSeen: stored.candyMatchTips };
  } catch {
    return EMPTY_PREFS;
  }
}

/** 尚未選過玩法時，由既有兒童模式決定：兒童模式＝輕鬆冒險。 */
export function resolveCandyMode(stored: CandyMode | null, kidsMode: boolean): CandyMode {
  return stored ?? (kidsMode ? "easy" : "challenge");
}

export function saveCandyMatchMode(mode: CandyMode): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ candyMatchMode: mode });
  } catch {
    // 儲存失敗時本局仍用選擇的玩法；下次開啟回到預設
  }
}

export function markCandyTipSeen(id: CandyMatchTipId): void {
  if (typeof window === "undefined") return;
  try {
    const current = getGameKitSettingsFromStore().candyMatchTips;
    if (current.includes(id)) return;
    saveGameKitSettingsToStore({ candyMatchTips: [...current, id] });
  } catch {
    // 儲存失敗只會讓引導下次再出現一次
  }
}
