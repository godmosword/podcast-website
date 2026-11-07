/**
 * 多多壽司屋八天的星星。寫在 cheche:progress 的 preferences.gameKit.dinoSushiDays。
 * 只會加上、不會清掉。第 4 天不寫這裡，星星仍走舊的 medals["dino-sushi"][0]。
 * 不發全站星星、不解車庫。貼紙陣列也不在這裡動。
 */

import { getGameKitSettingsFromStore, saveGameKitSettingsToStore } from "@/lib/progress-store";
import { mergeDayFlags, normalizeDayFlags } from "@/lib/games/dino-sushi/day-progress";

export type DinoSushiDaysWrite = {
  ok: boolean;
  /** 算進這次之後的八天。ok 為 false 時只活在記憶體，呼叫端要留著下次再寫。 */
  days: number[];
};

export function loadDinoSushiDays(): number[] {
  if (typeof window === "undefined") return normalizeDayFlags(undefined);
  try {
    return normalizeDayFlags(getGameKitSettingsFromStore().dinoSushiDays);
  } catch {
    return normalizeDayFlags(undefined);
  }
}

/**
 * 把幾天的獎牌 bit OR 進存檔。沒有新東西就不寫。
 * localStorage 滿了也不丟例外：結算不能因為存不進去就變成錯誤頁。
 */
export function saveDinoSushiDays(pending: readonly number[]): DinoSushiDaysWrite {
  const current = loadDinoSushiDays();
  const next = mergeDayFlags(current, pending);
  if (next.every((flags, i) => flags === current[i])) return { ok: true, days: current };
  try {
    saveGameKitSettingsToStore({ dinoSushiDays: next });
  } catch {
    return { ok: false, days: next };
  }
  return { ok: true, days: next };
}
