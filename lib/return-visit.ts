/**
 * 回訪訊號（STEM-P1 / FE-04 minimal）：
 * - 本機只存上次造訪時間 `cheche:last-visit-at`（epoch ms，不上傳原始值）。
 * - 距上次造訪 ≥ 6 小時才視為一次「回訪」，送 `return_visit { daysSince }`——
 *   只送天數區間（bucket），無時間戳、無識別碼，無指紋風險。
 * - `sessionStorage` guard：同一瀏覽 session 最多送一次；lastVisit 每 session 更新一次。
 */
import { trackReturnVisit } from "@/lib/analytics";

export const LAST_VISIT_KEY = "cheche:last-visit-at";
const RETURN_VISIT_SESSION_KEY = "cheche:return-visit-sent";
const RETURN_VISIT_THRESHOLD_MS = 6 * 60 * 60 * 1000;

export type ReturnVisitBucket =
  | "same-day"
  | "1d"
  | "2-3d"
  | "4-7d"
  | "8-30d"
  | "30d+";

const DAY_MS = 24 * 60 * 60 * 1000;

/** 距上次造訪的毫秒差 → 天數區間（只對外送 bucket）。 */
export function bucketDaysSince(gapMs: number): ReturnVisitBucket {
  const days = Math.floor(gapMs / DAY_MS);
  if (days < 1) return "same-day";
  if (days < 2) return "1d";
  if (days < 4) return "2-3d";
  if (days < 8) return "4-7d";
  if (days < 31) return "8-30d";
  return "30d+";
}

function hasStorage(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.localStorage?.getItem === "function" &&
      typeof window.sessionStorage?.getItem === "function"
    );
  } catch {
    return false;
  }
}

/**
 * 每次載入呼叫一次（ReturnVisitPing）。首訪只記時間不送事件；
 * 同 session 重複呼叫只更新 lastVisit 不重送。
 */
export function pingReturnVisit(now: number = Date.now()): void {
  if (!hasStorage()) return;
  try {
    const alreadySent =
      window.sessionStorage.getItem(RETURN_VISIT_SESSION_KEY) !== null;
    const rawLast = window.localStorage.getItem(LAST_VISIT_KEY);
    window.localStorage.setItem(LAST_VISIT_KEY, String(now));
    if (alreadySent) return;
    window.sessionStorage.setItem(RETURN_VISIT_SESSION_KEY, "1");

    if (rawLast === null) return; // 首訪：只建立基準，不送事件
    const last = Number(rawLast);
    if (!Number.isFinite(last)) return;
    const gap = now - last;
    if (gap < RETURN_VISIT_THRESHOLD_MS) return;
    trackReturnVisit(bucketDaysSince(gap));
  } catch {
    // storage 例外（隱私模式等）靜默略過，量測輔助不影響體驗。
  }
}
