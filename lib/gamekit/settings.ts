/** 遊樂園全域設定（Phase 7：兒童模式、可及性偏好）。 */

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
    const raw = localStorage.getItem(GAMEKIT_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameKitSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      version: 1,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveGameKitSettings(settings: GameKitSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    GAMEKIT_SETTINGS_KEY,
    JSON.stringify({ ...settings, version: 1 }),
  );
  window.dispatchEvent(new CustomEvent(GAMEKIT_SETTINGS_EVENT, { detail: settings }));
}

export function setKidsMode(enabled: boolean): GameKitSettings {
  const next = { ...loadGameKitSettings(), kidsMode: enabled };
  saveGameKitSettings(next);
  return next;
}
