import { describe, expect, it } from "vitest";
import { EVENT_KINDS, routeEvents } from "@/lib/games/orange-express/events";
import { JOURNAL_EVENT_KINDS } from "@/lib/games/orange-express/journal-record";
import {
  EMPTY_JOURNAL,
  freshStamps,
  greensOf,
  nextGoal,
  normalizeOrangeExpressJournal,
  progressOf,
  recordRun,
  type OrangeExpressJournal,
} from "@/lib/games/orange-express/journal";
import { createRun } from "@/lib/games/orange-express/reducer";
import type { DriverId, LevelId, RunState, StopGrade } from "@/lib/games/orange-express/types";

function finished(
  grades: StopGrade[],
  patch: Partial<RunState> = {},
  level: LevelId = "drive",
  driver: DriverId = "big",
): RunState {
  return { ...createRun(level, driver, 0), phase: "route-done", grades, ...patch };
}

/** 種子 0 的大司機：這一趟所有事件都記 done。 */
function allEventsDone(run: RunState): RunState["events"] {
  return Object.fromEntries(routeEvents(run.stations).map((event) => [event.key, "done" as const]));
}

describe("進步紀錄：跟上一趟比（PR-I3）", () => {
  it("第一次玩、低齡都不比；不改原本的紀錄", () => {
    const run = finished(["green", "yellow", "green"]);
    expect(progressOf(EMPTY_JOURNAL, run)).toBeNull();
    const little = finished(["green", "green", "green"], {}, "drive", "little");
    const journal = recordRun(EMPTY_JOURNAL, little, null);
    expect(progressOf(journal, little)).toBeNull();
    expect(EMPTY_JOURNAL).toEqual({ courses: {}, eventsDone: [], landmarks: [], goals: {} });
  });

  it("優先序：第一次每站都綠區＞綠區變多＞輕輕停變多＞第一次做到某種事件；只跟同一組比", () => {
    const first = finished(["yellow", "yellow", "green"], { smoothStops: 1 });
    const journal = recordRun(EMPTY_JOURNAL, first, null);
    expect(progressOf(journal, finished(["green", "green", "green"]))).toEqual({ kind: "all-green" });
    expect(progressOf(journal, finished(["green", "yellow", "green"]))).toEqual({ kind: "more-green" });
    expect(progressOf(journal, finished(["yellow", "yellow", "green"], { smoothStops: 2 }))).toEqual({
      kind: "more-smooth",
    });
    const same = finished(["yellow", "yellow", "green"], { smoothStops: 1 });
    expect(progressOf(journal, { ...same, events: allEventsDone(same) })).toEqual({ kind: "first-event", event: "ducks" });
    expect(progressOf(journal, same)).toBeNull();
    // 小站長沒開過：不跟大司機比。
    expect(progressOf(journal, finished(["green", "green", "green"], {}, "captain"))).toBeNull();
  });

  it("已經全綠過，再全綠不說「第一次」；綠區沒變多就看輕輕停", () => {
    const best = recordRun(EMPTY_JOURNAL, finished(["green", "green", "green"], { smoothStops: 1 }), null);
    expect(progressOf(best, finished(["green", "green", "green"], { smoothStops: 1 }))).toBeNull();
    expect(progressOf(best, finished(["green", "green", "green"], { smoothStops: 3 }))).toEqual({ kind: "more-smooth" });
  });
});

describe("上一趟說好的小目標做到了", () => {
  it("說好的那件做到了最先說；沒做到就照原本的優先序、不另外提醒", () => {
    const first = finished(["green", "yellow", "green"], { smoothStops: 1 });
    const journal = recordRun(EMPTY_JOURNAL, first, "smooth");
    expect(progressOf(journal, finished(["green", "yellow", "green"], { smoothStops: 3 }))).toEqual({
      kind: "goal-done",
      goal: "smooth",
    });
    expect(progressOf(journal, finished(["green", "green", "green"], { smoothStops: 1 }))).toEqual({ kind: "all-green" });
    const doors = recordRun(EMPTY_JOURNAL, first, "early-door");
    expect(progressOf(doors, first, 0)).toEqual({ kind: "goal-done", goal: "early-door" });
    expect(progressOf(doors, first, 2)).toBeNull();
    const ducks = recordRun(EMPTY_JOURNAL, first, "ducks");
    expect(progressOf(ducks, { ...first, events: allEventsDone(first) })).toEqual({ kind: "goal-done", goal: "ducks" });
  });
});

describe("下趟小目標", () => {
  it("少了星星就練那件；三顆星了看輕輕停，再來是沒做到的事件；都做到回 null", () => {
    const run = finished(["green", "yellow", "green"]);
    expect(nextGoal(run, "green")).toBe("green");
    expect(nextGoal(finished(["green", "green", "green"], { smoothStops: 1 }), null)).toBe("smooth");
    const smooth = finished(["green", "green", "green"], { smoothStops: 3 });
    expect(nextGoal(smooth, null)).toBe("ducks");
    expect(nextGoal({ ...smooth, events: allEventsDone(smooth) }, null)).toBeNull();
    expect(nextGoal(finished(["green", "green", "green"], {}, "drive", "little"), null)).toBeNull();
  });
});

describe("記一趟與沿途見聞", () => {
  it("記上次、最好；見聞只加不減；小目標換成新的，沒有就清掉", () => {
    const a = finished(["green", "green", "green"], { smoothStops: 2, landmarkGreets: [0, 2] });
    const withEvents = { ...a, events: allEventsDone(a) };
    let journal = recordRun(EMPTY_JOURNAL, withEvents, "smooth");
    expect(journal.courses.big).toEqual({ runs: 1, lastGreens: 3, bestGreens: 3, lastSmooth: 2 });
    expect(journal.eventsDone).toEqual(["ducks", "crossing", "wave", "race"]);
    expect(journal.landmarks).toEqual(["ferris", "house"]);
    expect(journal.goals.big).toBe("smooth");
    const b = finished(["yellow", "green", "yellow"], { landmarkGreets: [1] });
    journal = recordRun(journal, b, null);
    expect(journal.courses.big).toEqual({ runs: 2, lastGreens: 1, bestGreens: 3, lastSmooth: 0 });
    expect(journal.eventsDone).toHaveLength(4);
    expect(journal.landmarks).toEqual(["ferris", "house", "orange-tree"]);
    expect(journal.goals.big).toBeUndefined();
    expect(greensOf(b)).toBe(1);
  });

  it("這一趟新拿到的章：只算原本沒有的；什麼都沒多就是空的", () => {
    const a = finished(["green", "green", "green"], { landmarkGreets: [0] });
    const first = recordRun(EMPTY_JOURNAL, { ...a, events: allEventsDone(a) }, null);
    expect(freshStamps(EMPTY_JOURNAL, first)).toEqual({
      events: ["ducks", "crossing", "wave", "race"],
      landmarks: ["ferris"],
    });
    const b = finished(["green", "green", "green"], { landmarkGreets: [0, 2] });
    expect(freshStamps(first, recordRun(first, { ...b, events: allEventsDone(b) }, null))).toEqual({
      events: [],
      landmarks: ["house"],
    });
    expect(freshStamps(first, first)).toEqual({ events: [], landmarks: [] });
  });

  it("空的紀錄凍住，誰也改不到", () => {
    expect(Object.isFrozen(EMPTY_JOURNAL)).toBe(true);
    expect(Object.isFrozen(EMPTY_JOURNAL.eventsDone)).toBe(true);
    const fresh = normalizeOrangeExpressJournal(undefined);
    fresh.eventsDone.push("race");
    expect(EMPTY_JOURNAL.eventsDone).toEqual([]);
  });

  it("存檔用的事件種類清單跟 EVENT_KINDS 一樣（同一組、同一順序）", () => {
    expect(JOURNAL_EVENT_KINDS).toEqual(EVENT_KINDS);
  });

  it("舊存檔沒有、或欄位亂掉時當空的；不認得的值丟掉、數字夾在 0 以上", () => {
    expect(normalizeOrangeExpressJournal(undefined)).toEqual(EMPTY_JOURNAL);
    expect(normalizeOrangeExpressJournal("x")).toEqual(EMPTY_JOURNAL);
    const messy = normalizeOrangeExpressJournal({
      courses: {
        big: { runs: 2.7, lastGreens: 3, bestGreens: 1, lastSmooth: -1 },
        captain: { runs: 1, lastGreens: 1, bestGreens: 99, lastSmooth: 50 },
        nope: { runs: 1 },
        little: "x",
      },
      eventsDone: ["race", "ufo", "ducks"],
      landmarks: ["house", 3],
      goals: { big: "smooth", little: "fly", captain: "race" },
    } satisfies Record<string, unknown>);
    const expected: OrangeExpressJournal = {
      courses: {
        big: { runs: 2, lastGreens: 3, bestGreens: 3, lastSmooth: 0 },
        captain: { runs: 1, lastGreens: 1, bestGreens: 3, lastSmooth: 3 },
      },
      eventsDone: ["ducks", "race"],
      landmarks: ["house"],
      goals: { big: "smooth", captain: "race" },
    };
    expect(messy).toEqual(expected);
  });
});
