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
  /** 家長打開之後，地圖才出現輕鬆／挑戰。關掉不刪 mode。 */
  challengeUnlocked: boolean;
  tipsSeen: readonly CandyMatchTipId[];
};

const EMPTY_PREFS: CandyMatchPrefs = { mode: null, tipsSeen: [], challengeUnlocked: false };

export function loadCandyMatchPrefs(): CandyMatchPrefs {
  if (typeof window === "undefined") return EMPTY_PREFS;
  try {
    const stored = getGameKitSettingsFromStore();
    return {
      mode: stored.candyMatchMode,
      challengeUnlocked: stored.candyMatchChallengeUnlocked,
      tipsSeen: stored.candyMatchTips,
    };
  } catch {
    return EMPTY_PREFS;
  }
}

/**
 * 沒打開挑戰時一律輕鬆，已存的「挑戰」先留著。
 * 打開之後才沿用選擇；還沒選過也是輕鬆，不再用兒童模式開關猜成挑戰。
 */
export function resolveCandyMode(stored: CandyMode | null, challengeUnlocked: boolean): CandyMode {
  if (!challengeUnlocked) return "easy";
  return stored ?? "easy";
}

export function saveCandyMatchMode(mode: CandyMode): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ candyMatchMode: mode });
  } catch {
    // 儲存失敗時本局仍用選擇的玩法；下次開啟回到預設
  }
}

/** 只記家長有沒有打開挑戰，不改玩法、不改獎章。 */
export function saveCandyMatchChallengeUnlocked(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ candyMatchChallengeUnlocked: unlocked });
  } catch {
    // 儲存失敗時這次畫面仍照按鈕；下次開啟回到關著
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
