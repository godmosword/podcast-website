/** 遊樂園全域設定（Phase 7：兒童模式、可及性偏好）。 */

import {
  PROGRESS_CHANGE_EVENT,
  type BlockDropDifficultyPreference,
  type BlockDropSpecialModePreference,
  type MotionPreference,
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
} from "@/lib/progress-store";

export const GAMEKIT_SETTINGS_EVENT = "cheche:gamekit-settings-changed";

export type BlockDropDifficulty = BlockDropDifficultyPreference;
export type BlockDropSpecialMode = BlockDropSpecialModePreference;

export const BLOCK_DROP_DIFFICULTIES: {
  id: BlockDropDifficulty;
  label: string;
  hint: string;
}[] = [
  { id: "relaxed", label: "輕鬆", hint: "慢一點，到頂先救援一次" },
  { id: "standard", label: "標準", hint: "正常節奏，適合挑戰高分" },
  { id: "challenge", label: "挑戰", hint: "速度更快，分數倍率更高" },
];

export const BLOCK_DROP_SPECIAL_MODES: {
  id: BlockDropSpecialMode;
  label: string;
  hint: string;
}[] = [
  { id: "classic", label: "經典", hint: "純粹落下方塊" },
  { id: "rainbow", label: "彩虹消除", hint: "連續消行會觸發額外彩虹分" },
];

export type GameKitSettings = {
  version: 3;
  /** 預設開啟：較慢節奏、減少 Game Over 壓力 */
  kidsMode: boolean;
  blockDropDifficulty: BlockDropDifficulty;
  blockDropSpecialMode: BlockDropSpecialMode;
  gameVolume: number;
  motionPreference: MotionPreference;
};

// UX-P2-1：kidsMode 預設開啟時，Block Drop 新局的預設難度需為 relaxed，
// 故兩者預設值在此刻意保持一致。使用者一旦透過 setBlockDropDifficulty 明確
// 選過其他難度，該選擇會持久化並在之後的每一局被沿用（不受 kidsMode 影響），
// 詳見 lib/progress-store.ts 的 normalizeBlockDropDifficulty。
const DEFAULT_SETTINGS: GameKitSettings = {
  version: 3,
  kidsMode: true,
  blockDropDifficulty: "relaxed",
  blockDropSpecialMode: "classic",
  gameVolume: 1,
  motionPreference: "system",
};

export function loadGameKitSettings(): GameKitSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const stored = getGameKitSettingsFromStore();
    return {
      ...DEFAULT_SETTINGS,
      kidsMode: stored.kidsMode,
      blockDropDifficulty: stored.blockDropDifficulty,
      blockDropSpecialMode: stored.blockDropSpecialMode,
      gameVolume: stored.gameVolume,
      motionPreference: stored.motionPreference,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGameKitSettings(settings: GameKitSettings): void {
  if (typeof window === "undefined") return;
  saveGameKitSettingsToStore({
    kidsMode: settings.kidsMode,
    blockDropDifficulty: settings.blockDropDifficulty,
    blockDropSpecialMode: settings.blockDropSpecialMode,
    gameVolume: settings.gameVolume,
    motionPreference: settings.motionPreference,
  });
  window.dispatchEvent(new CustomEvent(GAMEKIT_SETTINGS_EVENT, { detail: settings }));
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGE_EVENT));
}
