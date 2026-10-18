/**
 * 《多多壽司屋》八天開店的進度。純函數，不讀存檔。
 * 第 4 天的星星仍是舊的 medals["dino-sushi"][0]，不抄進 dinoSushiDays。
 * 第 5–8 天這一階段還不能玩，就算舊檔已經通關、資料上開到第 5 天，按鈕仍鎖著。
 */

export const SUSHI_DAY_COUNT = 8;
/** 這一階段玩得到的最後一天。 */
export const SUSHI_PLAYABLE_DAY = 4;
/** 舊檔已經通關時，資料上開到第 5 天（玩法還在後面的階段）。 */
export const CLASSIC_UNLOCK_THROUGH = 5;

const MEDAL_MASK = 7;

export function emptyDayFlags(): number[] {
  return Array.from({ length: SUSHI_DAY_COUNT }, () => 0);
}

/** 舊存檔沒有這個欄位、或長度不對，都當成八天都還沒玩。只留 0–7 的整數。 */
export function normalizeDayFlags(value: unknown): number[] {
  const out = emptyDayFlags();
  if (!Array.isArray(value)) return out;
  for (let i = 0; i < SUSHI_DAY_COUNT; i++) {
    const raw = value[i];
    if (typeof raw !== "number" || !Number.isFinite(raw)) continue;
    out[i] = Math.max(0, Math.min(MEDAL_MASK, Math.trunc(raw)));
  }
  return out;
}

/** 第 4 天讀舊獎牌；其他天讀 dinoSushiDays。 */
export function flagsForDay(day: number, days: readonly number[], classicFlags: number): number {
  if (day === 4) return classicFlags & MEDAL_MASK;
  const raw = days[day - 1] ?? 0;
  return raw & MEDAL_MASK;
}

export function isDayCleared(flags: number): boolean {
  return (flags & 1) !== 0;
}

export function dayStarCount(flags: number): number {
  let count = 0;
  if (flags & 1) count += 1;
  if (flags & 2) count += 1;
  if (flags & 4) count += 1;
  return count;
}

/**
 * 第 1 天一直開著。
 * 前一天送完 5 單就開下一天。
 * 舊檔第 4 天已經通關的話，第 1–5 天在資料上都開著（人仍可以從第 1 天玩）。
 */
export function isDayUnlocked(day: number, days: readonly number[], classicFlags: number): boolean {
  if (day < 1 || day > SUSHI_DAY_COUNT) return false;
  if (day === 1) return true;
  if ((classicFlags & 1) !== 0 && day <= CLASSIC_UNLOCK_THROUGH) return true;
  return isDayCleared(flagsForDay(day - 1, days, classicFlags));
}

export function isDayPlayable(day: number): boolean {
  return day >= 1 && day <= SUSHI_PLAYABLE_DAY;
}

/** 最早一個開著、玩得到、還沒通關的天。都通關了就再玩第 4 天。 */
export function suggestedDay(days: readonly number[], classicFlags: number): number {
  for (let day = 1; day <= SUSHI_PLAYABLE_DAY; day++) {
    if (!isDayUnlocked(day, days, classicFlags)) continue;
    if (!isDayCleared(flagsForDay(day, days, classicFlags))) return day;
  }
  return SUSHI_PLAYABLE_DAY;
}
