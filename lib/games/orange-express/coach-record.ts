import type { CourseId } from "@/lib/games/orange-express/types";

/**
 * 第一次進站的停車示範記到哪裡（存在遊戲設定裡）。
 * 小小司機、大司機、小站長各一組（PR-I1：小站長的綠區窄一半，要自己示範一次）：
 * 停在綠區才算學會（照示範做就停得進綠區，黃區代表還沒抓到時機），沒學會最多示範 3 趟。
 * 這個檔不引 reducer，進度存檔（progress-store）也要用它正規化。
 */
export type CoachRecord = {
  /** 各組示範過幾趟（0–3）。 */
  littleRuns: number;
  littleLearned: boolean;
  bigRuns: number;
  bigLearned: boolean;
  captainRuns: number;
  captainLearned: boolean;
};

export const EMPTY_COACH: CoachRecord = {
  littleRuns: 0,
  littleLearned: false,
  bigRuns: 0,
  bigLearned: false,
  captainRuns: 0,
  captainLearned: false,
};
export const COACH_RUNS = 3;

export type CoachGroup = "little" | "big" | "captain";

const RUNS_KEY = { little: "littleRuns", big: "bigRuns", captain: "captainRuns" } as const;
const LEARNED_KEY = { little: "littleLearned", big: "bigLearned", captain: "captainLearned" } as const;

/** 慢慢看不示範：小橘自己會停。 */
export function coachGroup(course: CourseId): CoachGroup | null {
  return course === "look" ? null : course;
}

export function coachThisRun(course: CourseId, record: CoachRecord): boolean {
  const group = coachGroup(course);
  if (!group) return false;
  return !record[LEARNED_KEY[group]] && record[RUNS_KEY[group]] < COACH_RUNS;
}

/** 這一趟真的示範了（開到進站點）：這一組的趟數加一。開局就離開的不算。 */
export function startCoachRun(course: CourseId, record: CoachRecord): CoachRecord {
  const group = coachGroup(course);
  if (!group) return record;
  const key = RUNS_KEY[group];
  return { ...record, [key]: Math.min(COACH_RUNS, record[key] + 1) };
}

/** 示範中停在綠區：這一組學會了。 */
export function learnCoach(course: CourseId, record: CoachRecord): CoachRecord {
  const group = coachGroup(course);
  if (!group) return record;
  return { ...record, [LEARNED_KEY[group]]: true };
}

function runs(value: unknown): number {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : 0;
  return Math.min(COACH_RUNS, Math.max(0, n));
}

/**
 * 舊存檔（PR-I1 前）只有 littleRuns、littleLearned、bigLearned：大司機的「學會」照留（以前停進黃區也算，不再追回），
 * 小站長以前跟大司機共用，現在當沒看過，會再示範一次。
 */
export function normalizeOrangeExpressCoach(value: unknown): CoachRecord {
  if (!value || typeof value !== "object") return { ...EMPTY_COACH };
  const raw = value as Partial<Record<keyof CoachRecord, unknown>>;
  return {
    littleRuns: runs(raw.littleRuns),
    littleLearned: raw.littleLearned === true,
    bigRuns: runs(raw.bigRuns),
    bigLearned: raw.bigLearned === true,
    captainRuns: runs(raw.captainRuns),
    captainLearned: raw.captainLearned === true,
  };
}
