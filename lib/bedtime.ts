/** 睡前自動夜色窗：19:00–06:00（本地時間）。 */

export const BEDTIME_ATTRIBUTE = "data-bedtime";
export const BEDTIME_START_HOUR = 19;
export const BEDTIME_END_HOUR = 6;

export function isLocalBedtimeHour(hour: number): boolean {
  return hour >= BEDTIME_START_HOUR || hour < BEDTIME_END_HOUR;
}
