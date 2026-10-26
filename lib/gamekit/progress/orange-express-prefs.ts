import {
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
} from "@/lib/progress-store";
import {
  normalizeOrangeExpressLevel,
  resolveOrangeExpressLevel,
} from "@/lib/games/orange-express/level";
import type { LevelId } from "@/lib/games/orange-express/types";

export { normalizeOrangeExpressLevel, resolveOrangeExpressLevel };

/** 遊戲設定裡改了這兩個開關，駕駛台馬上跟著變。 */
export const ORANGE_EXPRESS_DISPLAY_EVENT = "cheche:orange-express-display";

export type OrangeExpressDisplay = {
  gaugeNumbers: boolean;
  sway: boolean;
};

export const DEFAULT_ORANGE_EXPRESS_DISPLAY: OrangeExpressDisplay = {
  gaugeNumbers: false,
  sway: true,
};

export function loadOrangeExpressLevel(): LevelId | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeOrangeExpressLevel(getGameKitSettingsFromStore().orangeExpressLevel);
  } catch {
    return null;
  }
}

export function saveOrangeExpressLevel(level: LevelId): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ orangeExpressLevel: level });
  } catch {
    // 存不進去時，這一輪仍用畫面上選的；下次再回到預設。
  }
}

export function loadOrangeExpressDisplay(): OrangeExpressDisplay {
  if (typeof window === "undefined") return { ...DEFAULT_ORANGE_EXPRESS_DISPLAY };
  try {
    const stored = getGameKitSettingsFromStore();
    return {
      gaugeNumbers: stored.orangeExpressGaugeNumbers === true,
      sway: stored.orangeExpressSway !== false,
    };
  } catch {
    return { ...DEFAULT_ORANGE_EXPRESS_DISPLAY };
  }
}

export function saveOrangeExpressDisplay(patch: Partial<OrangeExpressDisplay>): OrangeExpressDisplay {
  const next = { ...loadOrangeExpressDisplay(), ...patch };
  if (typeof window === "undefined") return next;
  try {
    saveGameKitSettingsToStore({
      orangeExpressGaugeNumbers: next.gaugeNumbers,
      orangeExpressSway: next.sway,
    });
  } catch {
    // 存不進去時只影響這一頁
  }
  window.dispatchEvent(new CustomEvent(ORANGE_EXPRESS_DISPLAY_EVENT, { detail: next }));
  return next;
}
