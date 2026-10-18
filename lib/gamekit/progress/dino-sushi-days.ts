/**
 * 多多壽司屋八天的星星。寫在 cheche:progress 的 preferences.gameKit.dinoSushiDays。
 * 只會加上、不會清掉。第 4 天不寫這裡，星星仍走舊的 medals["dino-sushi"][0]。
 * 不發全站星星、不解車庫。貼紙陣列也不在這裡動。
 */

import { getGameKitSettingsFromStore, saveGameKitSettingsToStore } from "@/lib/progress-store";
import { normalizeDayFlags, SUSHI_DAY_COUNT } from "@/lib/games/dino-sushi/day-progress";

export function loadDinoSushiDays(): number[] {
  if (typeof window === "undefined") return normalizeDayFlags(undefined);
  try {
    return normalizeDayFlags(getGameKitSettingsFromStore().dinoSushiDays);
  } catch {
    return normalizeDayFlags(undefined);
  }
}

/** 把這一輪的獎牌 bit OR 進指定那天。第 4 天略過。回傳寫完的八天。 */
export function saveDinoSushiDayFlags(day: number, flags: number): number[] {
  const current = loadDinoSushiDays();
  if (day < 1 || day > SUSHI_DAY_COUNT || day === 4) return current;
  const next = current.slice();
  next[day - 1] = (next[day - 1]! | (flags & 7)) & 7;
  if (next[day - 1] === current[day - 1]) return current;
  saveGameKitSettingsToStore({ dinoSushiDays: next });
  return next;
}
