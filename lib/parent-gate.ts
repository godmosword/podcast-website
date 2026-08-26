/**
 * UX-P0-1 家長閘門：進家庭儀表板前的簡單加法題。
 * sessionStorage 通過後放行；關分頁需重答。不是帳號／付費驗證。
 */

export const PARENT_GATE_SESSION_KEY = "cc-parent-gate-ok";

const ADDEND_MIN = 6;
const ADDEND_SPAN = 15; // 6–20

export type ParentGateChallenge = {
  a: number;
  b: number;
  prompt: string;
  answer: number;
};

export function createParentGateChallenge(
  random: () => number = Math.random,
): ParentGateChallenge {
  const a = ADDEND_MIN + Math.floor(clampUnit(random()) * ADDEND_SPAN);
  const b = ADDEND_MIN + Math.floor(clampUnit(random()) * ADDEND_SPAN);
  return {
    a,
    b,
    prompt: `${a} + ${b}`,
    answer: a + b,
  };
}

export function parseParentGateAnswer(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function isParentGateAnswerCorrect(
  challenge: ParentGateChallenge,
  raw: string,
): boolean {
  return parseParentGateAnswer(raw) === challenge.answer;
}

export function readParentGatePassed(): boolean {
  try {
    return sessionStorage.getItem(PARENT_GATE_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeParentGatePassed(): void {
  try {
    sessionStorage.setItem(PARENT_GATE_SESSION_KEY, "1");
  } catch {
    /* 私密模式等：仍由呼叫端 in-memory 放行 */
  }
}

export function clearParentGatePassed(): void {
  try {
    sessionStorage.removeItem(PARENT_GATE_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value >= 1) return 0.999999;
  return value;
}
