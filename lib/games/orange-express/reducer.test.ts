import { describe, expect, it } from "vitest";
import { medalsFor } from "@/lib/games/orange-express/medals";
import {
  BRAKE_ACCEL,
  POWER_ACCEL,
  accelFor,
  clampBrake,
  clampPower,
  createRun,
  currentLimit,
  gradeFor,
  honk,
  predictStop,
  step,
  withHook,
} from "@/lib/games/orange-express/reducer";
import { stationsFor } from "@/lib/games/orange-express/routes";
import type { RunState } from "@/lib/games/orange-express/types";

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

function boardAll(state: RunState): RunState {
  const count = state.stations[state.stationIndex]!.passengers.length;
  let next = state;
  for (let i = 0; i < count * 4; i += 1) {
    next = step(next, { type: "tick", dt: 0.1 });
  }
  return next;
}

function runUntil(state: RunState, done: (s: RunState) => boolean, limit = 400): RunState {
  let next = state;
  for (let i = 0; i < limit && !done(next); i += 1) {
    next = step(next, { type: "tick", dt: 0.05 });
  }
  return next;
}

describe("小橘特快車桿位", () => {
  it("動力 P0–P4、煞車 B0–B4 加緊急，一格一格吸附", () => {
    expect(POWER_ACCEL).toHaveLength(5);
    expect(BRAKE_ACCEL).toHaveLength(6);
    expect(clampPower(2.4)).toBe(2);
    expect(clampPower(9)).toBe(4);
    expect(clampPower(-1)).toBe(0);
    expect(clampBrake(4.6)).toBe(5);
    expect(clampBrake(Number.NaN)).toBe(0);
    for (let i = 1; i < POWER_ACCEL.length; i += 1) {
      expect(POWER_ACCEL[i]).toBeGreaterThan(POWER_ACCEL[i - 1]!);
    }
    for (let i = 1; i < BRAKE_ACCEL.length; i += 1) {
      expect(BRAKE_ACCEL[i]).toBeGreaterThan(BRAKE_ACCEL[i - 1]!);
    }
  });

  it("越高格加速越快；煞車一拉動力就斷開", () => {
    const base = at(createRun("drive"), { speed: 0.3, progress: 0.1 });
    const p1 = step(at(base, { power: 1 }), { type: "tick", dt: 0.1 });
    const p4 = step(at(base, { power: 4 }), { type: "tick", dt: 0.1 });
    expect(p4.speed).toBeGreaterThan(p1.speed);
    expect(accelFor(at(base, { power: 4, brake: 1 }))).toBeCloseTo(-BRAKE_ACCEL[1]);
  });

  it("緊急煞車比 B4 停得更快", () => {
    const base = at(createRun("drive"), { speed: 0.5, progress: 0.1 });
    const b4 = step(at(base, { brake: 4 }), { type: "tick", dt: 0.1 });
    const eb = step(at(base, { brake: 5 }), { type: "tick", dt: 0.1 });
    expect(eb.speed).toBeLessThan(b4.speed);
  });

  it("慢慢看的動力最高 P2，桿子推不上去", () => {
    const state = createRun("look");
    expect(state.power).toBe(1);
    expect(step(state, { type: "set-power", notch: 4 }).power).toBe(2);
  });

  it("門開著不能把動力加得更大；倒車時也不能推", () => {
    const open = at(createRun("drive"), { phase: "doors-open", power: 0, boarded: 0 });
    expect(step(open, { type: "set-power", notch: 1 })).toBe(open);
    const back = at(createRun("drive"), { phase: "reversing", progress: 0.7 });
    expect(step(back, { type: "set-power", notch: 2 })).toBe(back);
  });
});

describe("小橘特快車 step", () => {
  it("超過速度旗會慢慢收回來，不會直接停住", () => {
    const fast = at(createRun("drive"), { power: 0, brake: 0, speed: 1, progress: 0 });
    const bled = step(fast, { type: "tick", dt: 0.1 });
    expect(bled.speed).toBeLessThan(1);
    expect(bled.speed).toBeGreaterThanOrEqual(currentLimit(fast) - 0.001);
  });

  it("什麼都不推，車會自己慢慢變慢", () => {
    const coast = at(createRun("drive"), { speed: 0.5, progress: 0.1 });
    expect(step(coast, { type: "tick", dt: 0.1 }).speed).toBeLessThan(0.5);
  });

  it("停在綠區記綠、停在黃區記黃，同一站只記第一次", () => {
    const green = withHook(createRun("drive"), { progress: 0.65, speed: 0 });
    expect(green.phase).toBe("stopped");
    expect(green.grades[0]).toBe("green");
    const yellow = withHook(createRun("drive"), { progress: 0.52, speed: 0 });
    expect(yellow.grades[0]).toBe("yellow");
    const station = stationsFor("drive")[0]!;
    expect(gradeFor(station, 0.6)).toBe("green");
    expect(gradeFor(station, 0.7)).toBe("green");
    expect(gradeFor(station, 0.75)).toBe("yellow");
  });

  it("窗外停住不能開門", () => {
    const outside = at(createRun("drive"), { progress: 0.2, speed: 0, phase: "running" });
    expect(step(outside, { type: "open-doors" })).toBe(outside);
  });

  it("開過頭：記一次、小橘慢慢倒回窗前，沒有失敗", () => {
    const state = at(createRun("drive"), { progress: 0.79, speed: 0.8, phase: "in-window" });
    const over = step(state, { type: "tick", dt: 0.1 });
    expect(over.phase).toBe("reversing");
    expect(over.misses).toBe(1);
    expect(over.speed).toBe(0);
    expect(over.power).toBe(0);

    const halfway = step(over, { type: "tick", dt: 0.1 });
    expect(halfway.phase).toBe("reversing");
    expect(halfway.progress).toBeLessThan(over.progress);

    const back = runUntil(over, (s) => s.phase !== "reversing");
    expect(back.phase).toBe("running");
    expect(back.progress).toBeCloseTo(0.42, 2);
    expect(back.misses).toBe(1);
  });

  it("倒車大約兩到三秒", () => {
    let state = at(createRun("drive"), { progress: 0.8, phase: "reversing" });
    let seconds = 0;
    while (state.phase === "reversing" && seconds < 10) {
      state = step(state, { type: "tick", dt: 0.1 });
      seconds += 0.1;
    }
    expect(seconds).toBeGreaterThan(1.5);
    expect(seconds).toBeLessThan(3.5);
  });

  it("還沒停好就開門，回傳同一個狀態", () => {
    const state = at(createRun("drive"), { progress: 0.2, speed: 0.4, phase: "running" });
    expect(step(state, { type: "open-doors" })).toBe(state);
  });

  it("人還沒上來不能關門；最後一站關上門就到家", () => {
    const look = at(createRun("look"), { phase: "doors-open", boarded: 0, boardTimer: 0, grades: ["green"] });
    expect(step(look, { type: "close-doors" })).toBe(look);
    const boarded = boardAll(look);
    expect(boarded.boarded).toBe(2);
    const done = step(boarded, { type: "close-doors" });
    expect(done.phase).toBe("route-done");
    expect(medalsFor(done, 0)).toMatchObject({ cleared: true, flawless: true, stars: 3 });
  });

  it("停在黃區或倒車過是兩顆星", () => {
    const yellow = at(createRun("look"), { phase: "route-done", grades: ["yellow"] });
    expect(medalsFor(yellow, 0).stars).toBe(2);
    const missed = at(createRun("look"), { phase: "route-done", grades: ["green"], misses: 1 });
    expect(medalsFor(missed, 0).stars).toBe(2);
  });

  it("自己開：人上完才進下一站", () => {
    const state = at(createRun("drive"), { phase: "doors-open", boarded: 0, stationIndex: 0 });
    const ready = boardAll(state);
    expect(ready.boarded).toBe(1);
    const next = step(ready, { type: "close-doors" });
    expect(next.stationIndex).toBe(1);
    expect(next.phase).toBe("running");
    expect(next.progress).toBe(0);
  });

  it("慢慢看不拉煞車也會停在綠區", () => {
    const start = at(createRun("look"), { power: 2, brake: 0, progress: 0.2, speed: 0.5 });
    const state = runUntil(start, (s) => s.phase === "stopped");
    expect(state.phase).toBe("stopped");
    expect(state.grades[0]).toBe("green");
    expect(state.misses).toBe(0);
  });

  it("自己開不幫忙，不煞車就停不住", () => {
    let state = at(createRun("drive"), { power: 0, brake: 0, progress: 0.6, speed: 0.5, phase: "in-window" });
    for (let i = 0; i < 40; i += 1) {
      state = step(state, { type: "tick", dt: 0.1 });
      expect(state.phase).not.toBe("stopped");
    }
    expect(state.misses).toBeGreaterThan(0);
  });

  it("預測停車點：照現在的煞車算，真的停在附近", () => {
    const state = at(createRun("drive"), { brake: 2, progress: 0.5, speed: 0.35, phase: "in-window" });
    const predicted = predictStop(state);
    expect(predicted).not.toBeNull();
    const stopped = runUntil(state, (s) => s.phase === "stopped" || s.phase === "reversing");
    expect(stopped.phase).toBe("stopped");
    expect(Math.abs(stopped.progress - predicted!)).toBeLessThan(0.02);
  });

  it("還在加速時沒有預測點", () => {
    const state = at(createRun("drive"), { power: 3, progress: 0.4, speed: 0.3 });
    expect(predictStop(state)).toBeNull();
  });

  it("喇叭不改階段", () => {
    const state = createRun("drive");
    expect(honk(state)).toBe(state);
  });

  it("慢慢看只有一站，自己開與小站長各三站，站號不重複，綠區在黃區裡", () => {
    expect(stationsFor("look")).toHaveLength(1);
    for (const level of ["look", "drive", "captain"] as const) {
      for (const station of stationsFor(level)) {
        expect(station.target - station.greenHalf).toBeGreaterThan(station.window.start);
        expect(station.target + station.greenHalf).toBeLessThan(station.window.end);
        expect(station.approachAt).toBeLessThan(station.window.start);
      }
    }
    for (const level of ["drive", "captain"] as const) {
      const stations = stationsFor(level);
      expect(stations).toHaveLength(3);
      expect(new Set(stations.map((station) => station.id)).size).toBe(3);
    }
    expect(stationsFor("captain")[0]!.greenHalf).toBeLessThan(stationsFor("drive")[0]!.greenHalf);
  });

  it("測試鉤子可以設桿位，窗內速度 0 會變成停好", () => {
    const parked = withHook(createRun("drive"), { progress: 0.65, speed: 0, power: 3, brake: 2 });
    expect(parked.phase).toBe("stopped");
    expect(parked.power).toBe(3);
    expect(parked.brake).toBe(2);
  });
});
