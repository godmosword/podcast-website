import { describe, expect, it } from "vitest";
import {
  EMPTY_COACH,
  LITTLE_COACH_RUNS,
  coachGroup,
  coachThisRun,
  learnCoach,
  normalizeOrangeExpressCoach,
  startCoachRun,
} from "@/lib/games/orange-express/coach-record";

describe("進站示範的記錄", () => {
  it("小小司機一組；大司機與小站長共用一組；慢慢看不示範", () => {
    expect(coachGroup("little")).toBe("little");
    expect(coachGroup("big")).toBe("big");
    expect(coachGroup("captain")).toBe("big");
    expect(coachGroup("look")).toBeNull();
    expect(coachThisRun("look", EMPTY_COACH)).toBe(false);
  });

  it("小小司機停好一次才算學會；沒學會最多示範 3 趟", () => {
    let record = EMPTY_COACH;
    for (let run = 0; run < LITTLE_COACH_RUNS; run += 1) {
      expect(coachThisRun("little", record)).toBe(true);
      record = startCoachRun("little", record);
    }
    expect(record.littleRuns).toBe(3);
    expect(coachThisRun("little", record)).toBe(false);
    expect(coachThisRun("little", learnCoach("little", { ...EMPTY_COACH, littleRuns: 1 }))).toBe(false);
  });

  it("大司機停好一次就不再示範，小站長也不示範；趟數只算小小司機", () => {
    const shown = startCoachRun("big", EMPTY_COACH);
    expect(shown).toEqual(EMPTY_COACH);
    expect(coachThisRun("captain", shown)).toBe(true);
    const learned = learnCoach("big", shown);
    expect(coachThisRun("big", learned)).toBe(false);
    expect(coachThisRun("captain", learned)).toBe(false);
    expect(coachThisRun("little", learned)).toBe(true);
  });

  it("舊存檔沒有、或欄位亂掉時當沒看過；趟數夾在 0–3", () => {
    expect(normalizeOrangeExpressCoach(undefined)).toEqual(EMPTY_COACH);
    expect(normalizeOrangeExpressCoach("x")).toEqual(EMPTY_COACH);
    expect(normalizeOrangeExpressCoach({ littleRuns: 9, littleLearned: "yes", bigLearned: true })).toEqual({
      littleRuns: 3,
      littleLearned: false,
      bigLearned: true,
    });
    expect(normalizeOrangeExpressCoach({ littleRuns: -2.5 }).littleRuns).toBe(0);
  });
});
