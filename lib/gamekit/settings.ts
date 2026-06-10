/** 遊樂園全域設定（Phase 7：兒童模式、可及性偏好）。 */

import {
  PROGRESS_CHANGE_EVENT,
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
} from "@/lib/progress-store";

export const GAMEKIT_SETTINGS_KEY = "cheche:gamekit-settings";
export const GAMEKIT_SETTINGS_EVENT = "cheche:gamekit-settings-changed";

export type GameKitSettings = {
  version: 1;
  /** 預設開啟：較慢節奏、減少 Game Over 壓力 */
  kidsMode: boolean;
};

const DEFAULT_SETTINGS: GameKitSettings = {
  version: 1,
  kidsMode: true,
};

export function loadGameKitSettings(): GameKitSettings {
  if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const stored = getGameKitSettingsFromStore();
    return {
      ...DEFAULT_SETTINGS,
      kidsMode: stored.kidsMode,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGameKitSettings(settings: GameKitSettings): void {
  if (typeof window === "undefined") return;
  saveGameKitSettingsToStore({ kidsMode: settings.kidsMode });
  window.dispatchEvent(new CustomEvent(GAMEKIT_SETTINGS_EVENT, { detail: settings }));
  window.dispatchEvent(new CustomEvent(PROGRESS_CHANGE_EVENT));
}

export function setKidsMode(enabled: boolean): GameKitSettings {
  const next = { ...loadGameKitSettings(), kidsMode: enabled };
  saveGameKitSettings(next);
  return next;
}
