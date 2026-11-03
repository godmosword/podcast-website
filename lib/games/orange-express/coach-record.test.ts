import { describe, expect, it } from "vitest";
import {
  COACH_RUNS,
  EMPTY_COACH,
  coachGroup,
  coachThisRun,
  learnCoach,
  normalizeOrangeExpressCoach,
  startCoachRun,
} from "@/lib/games/orange-express/coach-record";

describe("進站示範的記錄", () => {
  it("小小司機、大司機、小站長各一組；慢慢看不示範", () => {
    expect(coachGroup("little")).toBe("little");
    expect(coachGroup("big")).toBe("big");
    expect(coachGroup("captain")).toBe("captain");
    expect(coachGroup("look")).toBeNull();
    expect(coachThisRun("look", EMPTY_COACH)).toBe(false);
  });

  it("每一組都是學會才停；沒學會最多示範 3 趟，趟數各算各的", () => {
    for (const course of ["little", "big", "captain"] as const) {
      let record = EMPTY_COACH;
      for (let run = 0; run < COACH_RUNS; run += 1) {
        expect(coachThisRun(course, record), course).toBe(true);
        record = startCoachRun(course, record);
      }
      expect(coachThisRun(course, record), course).toBe(false);
      const others = (["little", "big", "captain"] as const).filter((other) => other !== course);
      for (const other of others) expect(coachThisRun(other, record), `${course} → ${other}`).toBe(true);
      expect(coachThisRun(course, learnCoach(course, startCoachRun(course, EMPTY_COACH))), course).toBe(false);
    }
  });

  it("大司機學會了，小站長還是會示範一次（綠區窄一半，要自己學）", () => {
    const learned = learnCoach("big", startCoachRun("big", EMPTY_COACH));
    expect(coachThisRun("big", learned)).toBe(false);
    expect(coachThisRun("captain", learned)).toBe(true);
    expect(coachThisRun("little", learned)).toBe(true);
  });

  it("舊存檔沒有、或欄位亂掉時當沒看過；趟數夾在 0–3", () => {
    expect(normalizeOrangeExpressCoach(undefined)).toEqual(EMPTY_COACH);
    expect(normalizeOrangeExpressCoach("x")).toEqual(EMPTY_COACH);
    expect(normalizeOrangeExpressCoach({ littleRuns: -2.5, bigRuns: 7 })).toMatchObject({ littleRuns: 0, bigRuns: 3 });
  });

  it("PR-I1 前的舊存檔：大司機學會照留，小站長當沒看過", () => {
    expect(normalizeOrangeExpressCoach({ littleRuns: 9, littleLearned: "yes", bigLearned: true })).toEqual({
      ...EMPTY_COACH,
      littleRuns: 3,
      bigLearned: true,
    });
  });
});
