import type { CourseId } from "@/lib/games/orange-express/types";

/**
 * 第一次進站的停車示範記到哪裡（存在遊戲設定裡）。
 * 小小司機一組：停好一次才算學會，沒學會最多示範 3 趟。大司機與小站長共用一組：停好一次就不再示範。
 * 這個檔不引 reducer，進度存檔（progress-store）也要用它正規化。
 */
export type CoachRecord = {
  /** 小小司機示範過幾趟（0–3）。 */
  littleRuns: number;
  littleLearned: boolean;
  bigLearned: boolean;
};

export const EMPTY_COACH: CoachRecord = { littleRuns: 0, littleLearned: false, bigLearned: false };
export const LITTLE_COACH_RUNS = 3;

export type CoachGroup = "little" | "big";

/** 慢慢看不示範：小橘自己會停。 */
export function coachGroup(course: CourseId): CoachGroup | null {
  if (course === "little") return "little";
  if (course === "big" || course === "captain") return "big";
  return null;
}

export function coachThisRun(course: CourseId, record: CoachRecord): boolean {
  const group = coachGroup(course);
  if (group === "little") return !record.littleLearned && record.littleRuns < LITTLE_COACH_RUNS;
  if (group === "big") return !record.bigLearned;
  return false;
}

/** 這一趟真的示範了（開到進站點）：小小司機的趟數加一。開局就離開的不算。 */
export function startCoachRun(course: CourseId, record: CoachRecord): CoachRecord {
  if (coachGroup(course) !== "little") return record;
  return { ...record, littleRuns: Math.min(LITTLE_COACH_RUNS, record.littleRuns + 1) };
}

/** 示範中停在綠區或黃區：這一組學會了。 */
export function learnCoach(course: CourseId, record: CoachRecord): CoachRecord {
  const group = coachGroup(course);
  if (group === "little") return { ...record, littleLearned: true };
  if (group === "big") return { ...record, bigLearned: true };
  return record;
}

export function normalizeOrangeExpressCoach(value: unknown): CoachRecord {
  if (!value || typeof value !== "object") return { ...EMPTY_COACH };
  const raw = value as Partial<Record<keyof CoachRecord, unknown>>;
  const runs = typeof raw.littleRuns === "number" && Number.isFinite(raw.littleRuns) ? Math.floor(raw.littleRuns) : 0;
  return {
    littleRuns: Math.min(LITTLE_COACH_RUNS, Math.max(0, runs)),
    littleLearned: raw.littleLearned === true,
    bigLearned: raw.bigLearned === true,
  };
}
