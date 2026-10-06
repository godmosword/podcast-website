/**
 * 繽紛樂園專用偏好：玩法（輕鬆冒險／挑戰冒險／自由堆疊）與自由堆疊教學進度。
 * 存在 GameKit 統一設定（preferences.gameKit）。
 *
 * 教學進度搬遷（計劃 §6）：舊版存在獨立 key `cheche:block-drop-tutorial-v1`。
 * 讀取時若舊 key 有值，與新欄位取聯集寫回新欄位；舊 key 保留一個版本不刪（多分頁安全），
 * 壞資料視為未看過，但不清掉新欄位。
 */

import {
  BLOCK_DROP_TIP_IDS,
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
  type BlockDropModePreference,
  type BlockDropTipId,
} from "@/lib/progress-store";
import { BLOCK_DROP_TUTORIAL_STORAGE_KEY } from "@/lib/games/block-drop/tutorial";

export type BlockDropMode = Exclude<BlockDropModePreference, null>;
export type { BlockDropTipId };

export type BlockDropPrefs = {
  mode: BlockDropMode | null;
  tips: readonly BlockDropTipId[];
};

const EMPTY: BlockDropPrefs = { mode: null, tips: [] };

function readLegacyTips(): BlockDropTipId[] {
  try {
    const raw = window.localStorage.getItem(BLOCK_DROP_TUTORIAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Record<BlockDropTipId, unknown>>;
    return BLOCK_DROP_TIP_IDS.filter((id) => parsed?.[id] === true);
  } catch {
    return [];
  }
}

export function loadBlockDropPrefs(): BlockDropPrefs {
  if (typeof window === "undefined") return EMPTY;
  try {
    const stored = getGameKitSettingsFromStore();
    const legacy = readLegacyTips();
    const merged = BLOCK_DROP_TIP_IDS.filter((id) => stored.blockDropTips.includes(id) || legacy.includes(id));
    if (merged.length !== stored.blockDropTips.length) {
      saveGameKitSettingsToStore({ blockDropTips: merged });
    }
    return { mode: stored.blockDropMode, tips: merged };
  } catch {
    return EMPTY;
  }
}

/** 尚未選過玩法時，兒童模式＝輕鬆冒險，否則挑戰冒險。 */
export function resolveBlockDropMode(stored: BlockDropMode | null, kidsMode: boolean): BlockDropMode {
  return stored ?? (kidsMode ? "easy" : "challenge");
}

export function saveBlockDropMode(mode: BlockDropMode): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ blockDropMode: mode });
  } catch {
    // 儲存失敗時本局仍用選擇的玩法
  }
}

export function saveBlockDropTips(tips: readonly BlockDropTipId[]): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ blockDropTips: BLOCK_DROP_TIP_IDS.filter((id) => tips.includes(id)) });
  } catch {
    // 儲存失敗只會讓教學下次再出現
  }
}
