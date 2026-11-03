import {
  getGameKitSettingsFromStore,
  saveGameKitSettingsToStore,
} from "@/lib/progress-store";
import {
  normalizeOrangeExpressDriver,
  normalizeOrangeExpressLevel,
  resolveOrangeExpressDriver,
  resolveOrangeExpressLevel,
} from "@/lib/games/orange-express/level";
import { EMPTY_COACH, normalizeOrangeExpressCoach, type CoachRecord } from "@/lib/games/orange-express/coach-record";
import {
  EMPTY_JOURNAL,
  normalizeOrangeExpressJournal,
  type OrangeExpressJournal,
} from "@/lib/games/orange-express/journal-record";
import type { DriverId, LevelId } from "@/lib/games/orange-express/types";

export {
  normalizeOrangeExpressDriver,
  normalizeOrangeExpressLevel,
  resolveOrangeExpressDriver,
  resolveOrangeExpressLevel,
};

/** 遊戲設定裡改了顯示開關或司機，駕駛台與標題馬上跟著變。 */
export const ORANGE_EXPRESS_DISPLAY_EVENT = "cheche:orange-express-display";

export type OrangeExpressDisplay = {
  gaugeNumbers: boolean;
  sway: boolean;
  /** null＝家長沒切過，畫面再依兒童模式決定。 */
  driver: DriverId | null;
};

export const DEFAULT_ORANGE_EXPRESS_DISPLAY: OrangeExpressDisplay = {
  gaugeNumbers: false,
  sway: true,
  driver: null,
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
      driver: normalizeOrangeExpressDriver(stored.orangeExpressDriver),
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
      orangeExpressDriver: next.driver,
    });
  } catch {
    // 存不進去時只影響這一頁
  }
  window.dispatchEvent(new CustomEvent(ORANGE_EXPRESS_DISPLAY_EVENT, { detail: next }));
  return next;
}

/** 第一次進站的停車示範：讀不到（私密瀏覽、存檔壞掉）就當沒看過，只影響示範，不影響其他設定。 */
export function loadOrangeExpressCoach(): CoachRecord {
  if (typeof window === "undefined") return { ...EMPTY_COACH };
  try {
    return normalizeOrangeExpressCoach(getGameKitSettingsFromStore().orangeExpressCoach);
  } catch {
    return { ...EMPTY_COACH };
  }
}

export function saveOrangeExpressCoach(record: CoachRecord): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ orangeExpressCoach: normalizeOrangeExpressCoach(record) });
  } catch {
    // 存不進去時，下次開新頁會再示範一次。
  }
}

/** 進步紀錄與沿途見聞：讀不到就當空的（結算照原本那句、標題不放見聞），不影響開車。 */
export function loadOrangeExpressJournal(): OrangeExpressJournal {
  if (typeof window === "undefined") return normalizeOrangeExpressJournal(EMPTY_JOURNAL);
  try {
    return normalizeOrangeExpressJournal(getGameKitSettingsFromStore().orangeExpressJournal);
  } catch {
    return normalizeOrangeExpressJournal(EMPTY_JOURNAL);
  }
}

export function saveOrangeExpressJournal(journal: OrangeExpressJournal): void {
  if (typeof window === "undefined") return;
  try {
    saveGameKitSettingsToStore({ orangeExpressJournal: normalizeOrangeExpressJournal(journal) });
  } catch {
    // 存不進去時，下一趟沒有比較的對象，結算照原本那句。
  }
}
