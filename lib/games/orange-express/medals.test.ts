import { describe, expect, it } from "vitest";
import { medalsFor, starMissReason } from "@/lib/games/orange-express/medals";
import { createRun } from "@/lib/games/orange-express/reducer";
import type { DriverId, LevelId, RunState, StopGrade } from "@/lib/games/orange-express/types";

function finished(grades: StopGrade[], misses = 0, level: LevelId = "drive", driver: DriverId = "big"): RunState {
  return { ...createRun(level, driver), phase: "route-done", grades, misses };
}

describe("結算：少一顆星的原因", () => {
  it("三站都停綠區、沒開過頭、沒提早按門，三顆星、沒有提示", () => {
    const run = finished(["green", "green", "green"]);
    expect(medalsFor(run, 0).stars).toBe(3);
    expect(starMissReason(run, 0)).toBeNull();
  });

  it("有一站停在黃區，提示停在綠色區", () => {
    expect(starMissReason(finished(["green", "yellow", "green"]), 0)).toBe("green");
  });

  it("每站都綠區但開過頭倒車過，提示不要開過頭，不是停在綠色區", () => {
    const run = finished(["green", "green", "green"], 1);
    expect(medalsFor(run, 0).stars).toBe(2);
    expect(starMissReason(run, 0)).toBe("overrun");
  });

  it("每站都綠區但門還沒亮就按了，提示門亮了再按", () => {
    const run = finished(["green", "green", "green"]);
    expect(medalsFor(run, 2).stars).toBe(2);
    expect(starMissReason(run, 2)).toBe("early-door");
  });

  it("小站長門還沒亮就按了，也少一顆星", () => {
    const run = finished(["green", "green", "green"], 0, "captain");
    expect(medalsFor(run, 1).stars).toBe(2);
    expect(starMissReason(run, 1)).toBe("early-door");
  });

  it("慢慢看、小小司機門還沒亮就按了，當下提醒就好，不扣星", () => {
    for (const [level, driver] of [
      ["look", "big"],
      ["drive", "little"],
    ] as const) {
      const run = finished(["green", "green", "green"], 0, level, driver);
      expect(medalsFor(run, 3).stars, run.course).toBe(3);
      expect(starMissReason(run, 3), run.course).toBeNull();
    }
  });

  it("好幾個原因時先說停車位置，再說開過頭，最後才是門", () => {
    expect(starMissReason(finished(["yellow", "green", "green"], 1), 3)).toBe("green");
    expect(starMissReason(finished(["green", "green", "green"], 1), 3)).toBe("overrun");
  });
});
