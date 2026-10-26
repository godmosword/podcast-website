import { describe, expect, it } from "vitest";
import { medalsFor } from "@/lib/games/orange-express/medals";
import {
  createRun,
  currentLimit,
  honk,
  speedMeter,
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

describe("小橘特快車 step", () => {
  it("動力加速、煞車減速、超過旗子會慢慢收回來", () => {
    let state = at(createRun("drive"), { power: 2, brake: 0, speed: 0, progress: 0 });
    state = step(state, { type: "tick", dt: 0.1 });
    expect(state.speed).toBeGreaterThan(0);

    const braking = step(at(state, { power: 0, brake: 2 }), { type: "tick", dt: 0.1 });
    expect(braking.speed).toBeLessThan(state.speed);

    const fast = at(createRun("drive"), { power: 0, brake: 0, speed: 1, progress: 0 });
    const bled = step(fast, { type: "tick", dt: 0.1 });
    expect(bled.speed).toBeLessThan(1);
    expect(bled.speed).toBeGreaterThanOrEqual(currentLimit(fast) - 0.001);
  });

  it("只有在站窗裡、而且夠慢，才算停好", () => {
    const inside = step(
      at(createRun("drive"), { progress: 0.6, speed: 0.05, phase: "in-window" }),
      { type: "tick", dt: 0.1 },
    );
    expect(inside.phase).toBe("stopped");

    const outside = at(createRun("drive"), { progress: 0.2, speed: 0, phase: "running" });
    expect(step(outside, { type: "open-doors" })).toBe(outside);
  });

  it("衝過站窗會記一次，並退回窗前", () => {
    const state = at(createRun("drive"), { progress: 0.79, speed: 0.8, phase: "in-window" });
    const next = step(state, { type: "tick", dt: 0.1 });
    expect(next.misses).toBe(1);
    expect(next.phase).toBe("running");
    expect(next.progress).toBeCloseTo(0.32, 2);
  });

  it("還沒停好就開門，回傳同一個狀態", () => {
    const state = at(createRun("drive"), { progress: 0.2, speed: 0.4, phase: "running" });
    expect(step(state, { type: "open-doors" })).toBe(state);
  });

  it("門開著不能把動力加得更大", () => {
    const state = at(createRun("drive"), { phase: "doors-open", power: 0, boarded: 0 });
    expect(step(state, { type: "set-power", notch: 1 })).toBe(state);
    expect(step(state, { type: "set-power", notch: 0 })).toBe(state);
  });

  it("人還沒上來不能關門；最後一站關上門就到家", () => {
    const look = at(createRun("look"), { phase: "doors-open", boarded: 0, boardTimer: 0 });
    expect(step(look, { type: "close-doors" })).toBe(look);
    const boarded = boardAll(look);
    expect(boarded.boarded).toBe(2);
    const done = step(boarded, { type: "close-doors" });
    expect(done.phase).toBe("route-done");
    expect(medalsFor(done, 0).cleared).toBe(true);
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

  it("慢慢看不拉煞車也會在有限步數裡停住", () => {
    let state = at(createRun("look"), {
      power: 0,
      brake: 0,
      progress: 0.5,
      speed: 0.5,
      phase: "in-window",
    });
    let steps = 0;
    while (state.phase !== "stopped" && steps < 40) {
      state = step(state, { type: "tick", dt: 0.1 });
      steps += 1;
    }
    expect(state.phase).toBe("stopped");
    expect(state.progress).toBeLessThanOrEqual(0.92);
    expect(state.misses).toBe(0);
    expect(steps).toBeLessThan(40);
  });

  it("自己開不幫忙，不煞車就停不住", () => {
    let state = at(createRun("drive"), {
      power: 0,
      brake: 0,
      progress: 0.6,
      speed: 0.5,
      phase: "in-window",
    });
    for (let i = 0; i < 40; i += 1) {
      state = step(state, { type: "tick", dt: 0.1 });
      expect(state.phase).not.toBe("stopped");
    }
    expect(state.misses).toBeGreaterThan(0);
  });

  it("喇叭不改階段", () => {
    const state = createRun("drive");
    expect(honk(state)).toBe(state);
    expect(honk(state).phase).toBe("running");
  });

  it("慢慢看只有一站，自己開與小站長各三站，站號不重複", () => {
    expect(stationsFor("look")).toHaveLength(1);
    for (const level of ["drive", "captain"] as const) {
      const stations = stationsFor(level);
      expect(stations).toHaveLength(3);
      expect(new Set(stations.map((station) => station.id)).size).toBe(3);
    }
    const driveWindow = stationsFor("drive")[0]!.window;
    const captainWindow = stationsFor("captain")[0]!.window;
    expect(captainWindow.end - captainWindow.start).toBeLessThan(
      driveWindow.end - driveWindow.start,
    );
  });

  it("速度珠不會超過旗子，刻度最多 100", () => {
    const meter = speedMeter(5, 0.4);
    expect(meter.now).toBeLessThanOrEqual(100);
    expect(meter.text).toBe("到速度旗了");
    expect(speedMeter(0, 0.82).text).toBe("還可以再快");
  });

  it("掛上測試鉤子後，窗內速度 0 會變成停好", () => {
    const parked = withHook(createRun("look"), { progress: 0.6, speed: 0 });
    expect(parked.phase).toBe("stopped");
  });

  it("慢慢看的動力最高只有一格", () => {
    const state = createRun("look");
    expect(state.power).toBe(1);
    expect(step(state, { type: "set-power", notch: 2 }).power).toBe(1);
  });
});
