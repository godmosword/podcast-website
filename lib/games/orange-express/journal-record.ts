import type { StarMissReason } from "@/lib/games/orange-express/medals";
import type { CourseId, LandmarkId, ScenicEventKind } from "@/lib/games/orange-express/types";

/**
 * 小橘特快車的進步紀錄與沿途見聞（PR-I3，存在遊戲設定裡）。
 * 星星規則不動（完成兩顆、全綠三顆）；這裡記「比上次好一點」與「下次試試什麼」，讓重玩看得到進步：
 * - 每一組（大司機、小站長…）記上次與最好的停準站數、上次平穩停車幾站。
 * - 沿途見聞：做到過的事件種類、打過招呼的地標，只加不減。
 * - 下趟小目標：這一趟挑一件最值得練的，下一趟任務卡帶上。
 * 這個檔只放形狀與正規化（不引事件、reducer），進度存檔（progress-store）也要用它；算法在 journal.ts。
 */
export type CourseJournal = {
  runs: number;
  lastGreens: number;
  bestGreens: number;
  lastSmooth: number;
};

/** 下趟小目標：少的那顆星的原因、輕輕停，或還沒做到的沿途事件。 */
export type RunGoal = StarMissReason | "smooth" | ScenicEventKind;

export type OrangeExpressJournal = {
  courses: Partial<Record<CourseId, CourseJournal>>;
  eventsDone: ScenicEventKind[];
  landmarks: LandmarkId[];
  goals: Partial<Record<CourseId, RunGoal>>;
};

/** 空的紀錄（凍住：當 state 初值共用也不會被誰改到）。要新的一份用 normalizeOrangeExpressJournal(undefined)。 */
export const EMPTY_JOURNAL: OrangeExpressJournal = Object.freeze({
  courses: Object.freeze({}),
  eventsDone: Object.freeze([]) as unknown as ScenicEventKind[],
  landmarks: Object.freeze([]) as unknown as LandmarkId[],
  goals: Object.freeze({}),
}) as OrangeExpressJournal;

/** 一趟最多幾站（每一組都是三站，慢慢看一站）：壞存檔的大數字夾在這裡，不讓「第一次全綠」永遠判不到。 */
const MAX_STATIONS = 3;

/** 跟 events.ts 的 EVENT_KINDS 同一組同一順序（journal.test 守著）；這裡另寫一份，存檔不必載入事件模組。 */
export const JOURNAL_EVENT_KINDS: readonly ScenicEventKind[] = ["ducks", "crossing", "wave", "race"];

const COURSES: readonly CourseId[] = ["look", "little", "big", "captain"];
const LANDMARKS: readonly LandmarkId[] = ["ferris", "orange-tree", "house"];
const GOALS: readonly RunGoal[] = ["green", "overrun", "early-door", "smooth", ...JOURNAL_EVENT_KINDS];

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function pick<T extends string>(value: unknown, allowed: readonly T[]): T[] {
  if (!Array.isArray(value)) return [];
  return allowed.filter((item) => value.includes(item));
}

function normalizeCourse(value: unknown): CourseJournal | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Record<keyof CourseJournal, unknown>>;
  const stations = (n: unknown) => Math.min(MAX_STATIONS, count(n));
  const lastGreens = stations(raw.lastGreens);
  return {
    runs: count(raw.runs),
    lastGreens,
    bestGreens: Math.max(lastGreens, stations(raw.bestGreens)),
    lastSmooth: stations(raw.lastSmooth),
  };
}

export function normalizeOrangeExpressJournal(value: unknown): OrangeExpressJournal {
  if (!value || typeof value !== "object") return { courses: {}, eventsDone: [], landmarks: [], goals: {} };
  const raw = value as Partial<Record<keyof OrangeExpressJournal, unknown>>;
  const courses: OrangeExpressJournal["courses"] = {};
  const goals: OrangeExpressJournal["goals"] = {};
  const rawCourses = raw.courses && typeof raw.courses === "object" ? (raw.courses as Record<string, unknown>) : {};
  const rawGoals = raw.goals && typeof raw.goals === "object" ? (raw.goals as Record<string, unknown>) : {};
  for (const course of COURSES) {
    const entry = normalizeCourse(rawCourses[course]);
    if (entry) courses[course] = entry;
    const goal = rawGoals[course];
    if (typeof goal === "string" && (GOALS as readonly string[]).includes(goal)) goals[course] = goal as RunGoal;
  }
  return {
    courses,
    eventsDone: pick(raw.eventsDone, JOURNAL_EVENT_KINDS),
    landmarks: pick(raw.landmarks, LANDMARKS),
    goals,
  };
}
