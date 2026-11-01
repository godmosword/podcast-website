import { describe, expect, it } from "vitest";
import { coachBeat } from "@/lib/games/orange-express/coach";
import {
  legStart,
  routePosition,
  routeStops,
  scenicLength,
  sectionAt,
  sectionStart,
} from "@/lib/games/orange-express/journey";
import { windowNotice } from "@/lib/games/orange-express/notice";
import { createRun, pendingPoint, predictStop, step, withHook } from "@/lib/games/orange-express/reducer";
import { COURSE_RULES, SCENIC_LENGTH, stationsFor } from "@/lib/games/orange-express/routes";
import { jointsCrossed } from "@/lib/games/orange-express/sound";
import { stopBarFor } from "@/lib/games/orange-express/stop-target";
import { cameraTravel, STATION_WORLD } from "@/lib/games/orange-express/windshield";
import type { LevelId, DriverId, RunState } from "@/lib/games/orange-express/types";

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

function tick(state: RunState, dt = 1 / 60): RunState {
  return step(state, { type: "tick", dt });
}

/** 一直推到這一幀 progress 跨過 edge。 */
function crossEdge(state: RunState, edge: number): { before: RunState; after: RunState } {
  let s = state;
  for (let i = 0; i < 20000; i += 1) {
    const next = tick(s);
    if (s.progress < edge && next.progress >= edge) return { before: s, after: next };
    s = next;
  }
  throw new Error("沒有跨過段界");
}

/** 自動駕駛：推最快，示範說該拉時拉「停」，停好開門、等人、關門，直到終點。回傳走了幾秒。 */
function autopilot(level: LevelId, driver: DriverId): { state: RunState; seconds: number } {
  let s = step(createRun(level, driver), { type: "set-power", notch: 4 });
  let seconds = 0;
  const dt = 1 / 30;
  for (let i = 0; i < 40000 && s.phase !== "route-done"; i += 1) {
    const station = s.stations[s.stationIndex]!;
    if (s.phase === "stopped") s = step(s, { type: "open-doors" });
    else if (s.phase === "doors-open" && s.boarded >= station.passengers.length) {
      s = step(s, { type: "set-brake", notch: 0 });
      s = step(s, { type: "close-doors" });
      s = step(s, { type: "set-power", notch: 4 });
    } else if (s.phase !== "doors-open" && s.brake === 0 && coachBeat(s) === "brake") {
      s = step(s, { type: "set-power", notch: 0 });
      s = step(s, { type: "set-brake", notch: 3 });
    }
    s = tick(s, dt);
    seconds += dt;
  }
  return { state: s, seconds };
}

describe("旅程：風景段的形狀", () => {
  it("只有大司機有旅程；風景段順序是〔風景、站、風景、風景、站、風景、風景、站〕", () => {
    expect(COURSE_RULES.big.journey).toBe(true);
    for (const course of ["look", "little", "captain"] as const) expect(COURSE_RULES[course].journey).toBe(false);
    expect(stationsFor("drive", "big").map((station) => station.scenic.length)).toEqual([1, 2, 2]);
    for (const station of stationsFor("drive", "big")) {
      for (const section of station.scenic) expect(section.length).toBe(SCENIC_LENGTH);
    }
  });

  it("段的座標：出站是 -總長、站段起點是 0", () => {
    const slope = stationsFor("drive", "big")[1]!;
    expect(scenicLength(slope)).toBe(2);
    expect(legStart(slope)).toBe(-2);
    expect(sectionStart(slope, 0)).toBe(-2);
    expect(sectionStart(slope, 1)).toBe(-1);
    expect(sectionStart(slope, 2)).toBe(0);
    expect(sectionAt(slope, -2)).toBe(0);
    expect(sectionAt(slope, -1.01)).toBe(0);
    expect(sectionAt(slope, -1)).toBe(1);
    expect(sectionAt(slope, -0.001)).toBe(1);
    expect(sectionAt(slope, 0)).toBe(2);
    expect(sectionAt(slope, 0.65)).toBe(2);
  });

  it("沒有風景段的站：出站就是站段起點 +0", () => {
    const park = stationsFor("drive", "little")[0]!;
    expect(Object.is(legStart(park), 0)).toBe(true);
    expect(sectionAt(park, 0)).toBe(0);
  });
});

describe("旅程：重設表", () => {
  it("開局：大司機從第一段風景段出發，其他規則組照舊從 0", () => {
    expect(createRun("drive", "big").progress).toBe(-1);
    expect(Object.is(createRun("drive", "little").progress, 0)).toBe(true);
    expect(Object.is(createRun("look").progress, 0)).toBe(true);
    expect(Object.is(createRun("captain").progress, 0)).toBe(true);
  });

  it("風景→風景：段號加一，速度、作用、桿位都連續，不停車也不廣播", () => {
    const start = withHook(createRun("drive", "big"), { stationIndex: 1, section: 0, speed: 0.82, power: 4 });
    expect(sectionAt(start.stations[1]!, start.progress)).toBe(0);
    const { before, after } = crossEdge(start, -1);
    expect(sectionAt(after.stations[1]!, after.progress)).toBe(1);
    expect(after.stationIndex).toBe(1);
    expect(after.phase).toBe("running");
    expect(after.power).toBe(before.power);
    expect(Math.abs(after.speed - before.speed)).toBeLessThan(0.01);
    expect(Math.abs(after.tractive - before.tractive)).toBeLessThan(0.01);
  });

  it("風景→站段：進到站段，速度連續；對向列車、鐵橋、提前減速是站段的初值", () => {
    const start = withHook(createRun("drive", "big"), { stationIndex: 1, section: 1, speed: 0.82, power: 4 });
    const { before, after } = crossEdge(start, 0);
    expect(sectionAt(after.stations[1]!, after.progress)).toBe(2);
    expect(Math.abs(after.speed - before.speed)).toBeLessThan(0.01);
    expect(after.passing).toBeNull();
    expect(after.bridgeGreeted).toBe(false);
    expect(after.slowPrep).toBeNull();
    expect(after.phase).toBe("running");
  });

  it("站段關門→下一站：站號加一、從下一站第一段風景段出發，成績留著", () => {
    let s = at(createRun("drive", "big"), { phase: "doors-open", boarded: 1, grades: ["green"] });
    s = step(s, { type: "close-doors" });
    expect(s.stationIndex).toBe(1);
    expect(s.progress).toBe(-2);
    expect(sectionAt(s.stations[1]!, s.progress)).toBe(0);
    expect(s.grades).toEqual(["green"]);
    expect(s.signal).toBe("green");
  });

  it("掛鉤：跳站沒寫 progress 停在站段；寫 section 跳到那一段起點；跳段清掉提前減速", () => {
    const run = at(createRun("drive", "big"), { slowPrep: 0.2 });
    const jumped = withHook(run, { stationIndex: 2 });
    expect(jumped.progress).toBeGreaterThanOrEqual(0);
    const scenic = withHook(run, { stationIndex: 2, section: 1 });
    expect(scenic.progress).toBe(-1);
    expect(scenic.slowPrep).toBeNull();
    // 不能跳到這一站出站之前。
    expect(withHook(run, { stationIndex: 0, progress: -5 }).progress).toBe(-1);
    // 不開旅程的規則組照舊夾在 0。
    expect(withHook(createRun("captain"), { progress: -1 }).progress).toBe(0);
  });

  it("掛鉤寫紅燈：從這一站出站那一刻（第一段風景段起點）等，不跳過風景段", () => {
    const red = withHook(createRun("drive", "big"), { stationIndex: 1, signal: "red" });
    expect(red.signal).toBe("red");
    expect(red.progress).toBe(-2);
    expect(Object.is(withHook(createRun("captain"), { stationIndex: 1, signal: "red" }).progress, 0)).toBe(true);
  });

  it("鐵軌接縫聲：段界剛好是一般的接縫，跨過段界只響一聲，跟站段裡一樣", () => {
    expect(jointsCrossed(-1.01, -0.99)).toBe(1);
    expect(jointsCrossed(-0.01, 0.01)).toBe(1);
    expect(jointsCrossed(0.49, 0.51)).toBe(1);
    expect(jointsCrossed(-1.04, -1.01)).toBe(0);
  });
});

describe("旅程：風景段沒有站的東西", () => {
  const scenic = withHook(createRun("drive", "big"), { stationIndex: 1, section: 1, speed: 0.6, power: 0, brake: 3 });

  it("沒有停車預測、停車目標條、示範、指差、前窗提示", () => {
    expect(scenic.progress).toBeLessThan(0);
    expect(predictStop(scenic)).toBeNull();
    expect(stopBarFor(scenic)).toBeNull();
    expect(coachBeat(scenic)).toBe("none");
    expect(pendingPoint(scenic)).toBeNull();
    expect(windowNotice(scenic, false)).toBeNull();
  });

  it("在風景段停下來不算到站：沒有成績，推動力再走", () => {
    let s = scenic;
    for (let i = 0; i < 600 && s.speed > 0; i += 1) s = tick(s);
    expect(s.speed).toBe(0);
    expect(s.phase).toBe("running");
    expect(s.grades).toEqual([]);
    expect(step(s, { type: "open-doors" })).toBe(s);
  });
});

describe("旅程：前窗與路線條的座標", () => {
  it("段界前窗不跳：跨過風景段與站段的那一幀，鏡頭只多走這一幀的路", () => {
    for (const edge of [-1, 0]) {
      const start = withHook(createRun("drive", "big"), { stationIndex: 1, section: 0, speed: 0.82, power: 4 });
      const { before, after } = crossEdge(start, edge);
      const target = after.stations[1]!.target;
      const moved = cameraTravel(false, after.progress, after.phase, target) -
        cameraTravel(false, before.progress, before.phase, target);
      const expected = (after.progress - before.progress) * STATION_WORLD;
      expect(Math.abs(moved - expected)).toBeLessThan(1);
      expect(moved).toBeGreaterThan(0);
      expect(moved).toBeLessThan(3);
    }
  });

  it("減少動態：風景段每段一格（那一段中間），站段照舊三格", () => {
    const scenic = stationsFor("drive", "big")[1]!.scenic;
    expect(cameraTravel(true, -1.9, "running", 0.65, { scenic })).toBe(-1.5 * STATION_WORLD);
    expect(cameraTravel(true, -1.1, "running", 0.65, { scenic })).toBe(-1.5 * STATION_WORLD);
    expect(cameraTravel(true, -0.9, "running", 0.65, { scenic })).toBe(-0.5 * STATION_WORLD);
    expect(cameraTravel(true, 0.01, "running", 0.65, { scenic })).toBe(0);
  });

  it("路線條：站點照一程（出站到停車目標）的長度排，最後一站在最右邊", () => {
    const stops = routeStops(stationsFor("drive", "big"));
    expect(stops).toHaveLength(3);
    expect(stops[2]).toBe(1);
    const total = 1.65 + 2.65 + 2.65;
    expect(stops[0]).toBeCloseTo(1.65 / total, 6);
    expect(stops[1]).toBeCloseTo(4.3 / total, 6);
  });

  it("小橘的位置：開局 0、停好在站點、倒車與開過頭夾在站點、到家 1", () => {
    const run = createRun("drive", "big");
    const stops = routeStops(run.stations);
    expect(routePosition(run)).toBe(0);
    expect(routePosition(at(run, { progress: run.stations[0]!.target }))).toBeCloseTo(stops[0]!, 6);
    expect(routePosition(at(run, { progress: 0.79 }))).toBeCloseTo(stops[0]!, 6);
    expect(routePosition(at(run, { stationIndex: 1, progress: -2 }))).toBeCloseTo(stops[0]!, 6);
    expect(routePosition(at(run, { phase: "route-done" }))).toBe(1);
  });
});

describe("旅程：不開旅程的規則組不變", () => {
  for (const [level, driver] of [
    ["look", "big"],
    ["drive", "little"],
    ["captain", "big"],
  ] as const) {
    it(`${level}/${driver}：沒有風景段，整趟照舊`, () => {
      const stations = stationsFor(level, driver);
      for (const station of stations) expect(station.scenic).toEqual([]);
      const { state } = autopilot(level, driver);
      expect(state.phase).toBe("route-done");
      expect(state.grades).toHaveLength(stations.length);
      expect(state.stationIndex).toBe(stations.length - 1);
    });
  }

  it("大司機整趟開得完，風景段讓一趟至少多開五段巡航的時間", () => {
    const big = autopilot("drive", "big");
    expect(big.state.phase).toBe("route-done");
    expect(big.state.grades).toHaveLength(3);
    // 五段風景段每段巡航約 6.8 秒；自動駕駛不猶豫、不重停，站段三站合起來約 17 秒（人開約慢一倍以上）。
    const scenicSeconds = (5 * SCENIC_LENGTH) / (0.82 * 0.18);
    expect(big.seconds).toBeGreaterThan(scenicSeconds + 10);
  });
});
