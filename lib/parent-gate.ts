/**
 * 家長閘門的純函式：兩位數 × 一位數算術題，防孩子誤觸儀表板。
 * 這不是驗證、授權或安全機制——沒有嘗試上限、鎖定、雜湊或失敗紀錄。
 */

export const PARENT_GATE_STORAGE_KEY = "cheche:parent-gate";
export const PARENT_GATE_PASSED_VALUE = "passed";

export type ParentGateChallenge = {
  /** 10–19 */
  multiplicand: number;
  /** 3–9 */
  multiplier: number;
  /** 文字題，例如「14 × 3」 */
  prompt: string;
  answer: number;
};

export const PARENT_GATE_COPY = {
  title: "給爸爸媽媽的小確認",
  hint: "這一題是為了確認由大人操作",
  questionPrefix: "請算出",
  submit: "繼續",
  retry: "再試一次",
  answerPlaceholder: "答案",
} as const;

/** 決定性 RNG（LCG），方便測試注入種子。 */
export function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function pickInt(random: () => number, min: number, max: number): number {
  const span = max - min + 1;
  const value = min + Math.floor(random() * span);
  return Math.min(max, Math.max(min, value));
}

export function createParentGateChallenge(
  random: () => number = Math.random,
): ParentGateChallenge {
  const multiplicand = pickInt(random, 10, 19);
  const multiplier = pickInt(random, 3, 9);
  return {
    multiplicand,
    multiplier,
    prompt: `${multiplicand} × ${multiplier}`,
    answer: multiplicand * multiplier,
  };
}

export function checkParentGateAnswer(
  challenge: ParentGateChallenge,
  raw: string,
): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed === challenge.answer;
}

function canUseSessionStorage(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return typeof window.sessionStorage?.getItem === "function";
  } catch {
    return false;
  }
}

/** 無痕／停用儲存時視為未通過，每次進頁都出題，不放行。 */
export function readParentGatePassed(): boolean {
  if (!canUseSessionStorage()) return false;
  try {
    return (
      sessionStorage.getItem(PARENT_GATE_STORAGE_KEY) ===
      PARENT_GATE_PASSED_VALUE
    );
  } catch {
    return false;
  }
}

export function writeParentGatePassed(): void {
  if (!canUseSessionStorage()) return;
  try {
    sessionStorage.setItem(PARENT_GATE_STORAGE_KEY, PARENT_GATE_PASSED_VALUE);
  } catch {
    // 寫入失敗就讓下次進頁再出題；本輪畫面狀態由元件自己管。
  }
}
