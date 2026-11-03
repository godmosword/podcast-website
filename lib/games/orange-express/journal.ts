import { EVENT_KINDS, routeEvents } from "@/lib/games/orange-express/events";
import {
  type CourseJournal,
  type OrangeExpressJournal,
  type RunGoal,
} from "@/lib/games/orange-express/journal-record";
import type { StarMissReason } from "@/lib/games/orange-express/medals";
import type { CourseId, LandmarkId, RunState, ScenicEventKind } from "@/lib/games/orange-express/types";

export {
  EMPTY_JOURNAL,
  normalizeOrangeExpressJournal,
  type CourseJournal,
  type OrangeExpressJournal,
  type RunGoal,
} from "@/lib/games/orange-express/journal-record";

/** 進步紀錄的算法（PR-I3）：跟上一趟比、下趟小目標、記一趟。形狀與正規化在 journal-record.ts。 */
/** 進步那句與小目標只給大司機、小站長；低齡結算不提技巧（只說「你把朋友載到了」）。 */
export function journalCourse(course: CourseId): boolean {
  return course === "big" || course === "captain";
}

export type RunSummary = Pick<RunState, "course" | "grades" | "smoothStops" | "stations" | "events" | "landmarkGreets">;

export function greensOf(run: Pick<RunState, "grades">): number {
  return run.grades.filter((grade) => grade === "green").length;
}

/** 這一趟做到的事件種類（照 EVENT_KINDS 順序）。 */
export function doneKinds(run: Pick<RunState, "stations" | "events">): ScenicEventKind[] {
  const done = new Set(
    routeEvents(run.stations)
      .filter((event) => run.events[event.key] === "done")
      .map((event) => event.kind),
  );
  return EVENT_KINDS.filter((kind) => done.has(kind));
}

export type RunProgress =
  | { kind: "goal-done"; goal: RunGoal }
  | { kind: "all-green" }
  | { kind: "more-green" }
  | { kind: "more-smooth" }
  | { kind: "first-event"; event: ScenicEventKind };

/** 上一趟說好的小目標，這一趟做到了沒（提早按門要另外給次數，reducer 不記）。 */
export function goalDone(goal: RunGoal, run: RunSummary & Pick<RunState, "misses">, earlyDoorTaps: number): boolean {
  if (goal === "green") return greensOf(run) === run.stations.length;
  if (goal === "overrun") return run.misses === 0;
  if (goal === "early-door") return earlyDoorTaps === 0;
  if (goal === "smooth") return run.smoothStops >= run.stations.length;
  const these = routeEvents(run.stations).filter((event) => event.kind === goal);
  return these.length > 0 && these.every((event) => run.events[event.key] === "done");
}

/**
 * 跟上一趟（同一組）比，挑一件進步了的事；第一次玩、或沒有比較好就回 null（結算照原本那句）。
 * 優先序：上一趟說好的小目標做到了（「說好 → 做到 → 被說出來」，設計審）＞第一次每站都綠區＞
 * 停在綠區的站變多＞輕輕停的站變多＞第一次做到某種沿途事件。沒做到說好的不另外提醒。
 */
export function progressOf(
  journal: OrangeExpressJournal,
  run: RunSummary & Pick<RunState, "misses">,
  earlyDoorTaps = 0,
): RunProgress | null {
  if (!journalCourse(run.course)) return null;
  const goal = journal.goals[run.course];
  if (goal && goalDone(goal, run, earlyDoorTaps)) return { kind: "goal-done", goal };
  const prev = journal.courses[run.course];
  if (!prev) return null;
  const greens = greensOf(run);
  if (greens === run.stations.length && prev.bestGreens < run.stations.length) return { kind: "all-green" };
  if (greens > prev.lastGreens) return { kind: "more-green" };
  if (run.smoothStops > prev.lastSmooth) return { kind: "more-smooth" };
  const first = doneKinds(run).find((kind) => !journal.eventsDone.includes(kind));
  return first ? { kind: "first-event", event: first } : null;
}

/**
 * 下趟小目標（一件）：少了星星就練那件（跟結算星星下的小籤同一件）；三顆星了才看輕輕停，
 * 再來是這一趟遇到了卻沒做到的沿途事件（照 EVENT_KINDS 順序）。都做到了回 null。
 */
export function nextGoal(run: RunSummary, missReason: StarMissReason | null): RunGoal | null {
  if (!journalCourse(run.course)) return null;
  if (missReason) return missReason;
  if (run.smoothStops < run.stations.length) return "smooth";
  const all = routeEvents(run.stations);
  for (const kind of EVENT_KINDS) {
    if (all.some((event) => event.kind === kind && run.events[event.key] !== "done")) return kind;
  }
  return null;
}

function union<T>(list: readonly T[], more: readonly T[]): T[] {
  const out = [...list];
  for (const item of more) if (!out.includes(item)) out.push(item);
  return out;
}

/** 開完一趟：記下這一組的成績、加進見聞、換成新的小目標。回傳新的紀錄（不改原本的）。 */
export function recordRun(journal: OrangeExpressJournal, run: RunSummary, goal: RunGoal | null): OrangeExpressJournal {
  const prev = journal.courses[run.course];
  const greens = greensOf(run);
  const course: CourseJournal = {
    runs: (prev?.runs ?? 0) + 1,
    lastGreens: greens,
    bestGreens: Math.max(prev?.bestGreens ?? 0, greens),
    lastSmooth: run.smoothStops,
  };
  const goals = { ...journal.goals };
  if (goal) goals[run.course] = goal;
  else delete goals[run.course];
  return {
    courses: { ...journal.courses, [run.course]: course },
    eventsDone: union(journal.eventsDone, doneKinds(run)),
    landmarks: union(
      journal.landmarks,
      run.landmarkGreets.map((index) => run.stations[index]?.landmark).filter((id): id is LandmarkId => !!id),
    ),
    goals,
  };
}
