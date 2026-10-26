import { describe, expect, it } from "vitest";
import { createRun, withHook } from "@/lib/games/orange-express/reducer";
import { STATION_METERS, remainingWords, stopBarFor } from "@/lib/games/orange-express/stop-target";
import type { RunState } from "@/lib/games/orange-express/types";

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

describe("停車目標條", () => {
  it("進站前不出現，進站後出現", () => {
    expect(stopBarFor(at(createRun("drive"), { progress: 0.2, speed: 0.6 }))).toBeNull();
    expect(stopBarFor(at(createRun("drive"), { progress: 0.4, speed: 0.4 }))).not.toBeNull();
  });

  it("綠區在黃區裡，目標線在綠區中間", () => {
    const bar = stopBarFor(at(createRun("drive"), { progress: 0.4, speed: 0.4 }))!;
    expect(bar.green[0]).toBeGreaterThan(bar.yellow[0]);
    expect(bar.green[1]).toBeLessThan(bar.yellow[1]);
    expect(bar.target).toBeCloseTo((bar.green[0] + bar.green[1]) / 2, 0);
  });

  it("拉煞車才有預測停車點，並告訴畫面會停在哪一區", () => {
    const coasting = stopBarFor(at(createRun("drive"), { progress: 0.45, speed: 0.4, power: 2 }))!;
    expect(coasting.predicted).toBeNull();
    const braking = stopBarFor(at(createRun("drive"), { progress: 0.6, speed: 0.3, brake: 2 }))!;
    expect(braking.predicted).not.toBeNull();
    expect(braking.predictedGrade).toBe("green");
    const late = stopBarFor(at(createRun("drive"), { progress: 0.72, speed: 0.6, brake: 1 }))!;
    expect(late.predictedGrade).toBeNull();
  });

  it("剩餘距離與孩子看得懂的話", () => {
    const bar = stopBarFor(at(createRun("drive"), { progress: 0.5, speed: 0.4 }))!;
    expect(bar.remainingMeters).toBe(Math.round(0.15 * STATION_METERS));
    expect(bar.words).toBe("快到了");
    expect(remainingWords(500, 75)).toBe("還有一段路");
    expect(remainingWords(60, 20)).toBe("再一點點");
    expect(remainingWords(10, 75)).toBe("停在這裡");
    expect(remainingWords(-100, 75)).toBe("過了一點點");
  });

  it("倒車時也留著，停好之後預測點收起來", () => {
    const back = stopBarFor(at(createRun("drive"), { progress: 0.3, phase: "reversing" }));
    expect(back).not.toBeNull();
    expect(back!.predicted).toBeNull();
    const parked = stopBarFor(withHook(createRun("drive"), { progress: 0.65, speed: 0 }))!;
    expect(parked.predicted).toBeNull();
    expect(parked.words).toBe("停在這裡");
  });
});
