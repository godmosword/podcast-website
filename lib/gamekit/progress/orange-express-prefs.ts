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
