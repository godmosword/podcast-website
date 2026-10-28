import { describe, expect, it } from "vitest";
import {
  AUTO_BRAKE_DECEL,
  CRUISE_LIMIT,
  PASS_DURATION,
  createRun,
  currentLimit,
  currentStation,
  inTunnel,
  nextSign,
  onBridge,
  pendingPoint,
  pointTotal,
  step,
  withHook,
} from "@/lib/games/orange-express/reducer";
import { COURSE_RULES, courseFor, stationsFor } from "@/lib/games/orange-express/routes";
import { medalsFor } from "@/lib/games/orange-express/medals";
import type { RunState } from "@/lib/games/orange-express/types";

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

function run(state: RunState, seconds: number, dt = 0.05): RunState {
  let s = state;
  for (let t = 0; t < seconds; t += dt) s = step(s, { type: "tick", dt });
  return s;
}

describe("路線：四組規則", () => {
  it("自己開依司機分成小小司機與大司機，其他檔不受影響", () => {
    expect(courseFor("drive", "little")).toBe("little");
    expect(courseFor("drive", "big")).toBe("big");
    expect(courseFor("look", "big")).toBe("look");
    expect(courseFor("captain", "little")).toBe("captain");
    expect(createRun("drive", "little").course).toBe("little");
  });

  it("只有大司機與小站長有速限牌與指差確認", () => {
    for (const course of ["look", "little"] as const) {
      expect(COURSE_RULES[course]).toEqual({ signs: false, autoBrake: false, pointing: false });
    }
    for (const station of stationsFor("drive", "little")) {
      expect(station.signs).toHaveLength(0);
      expect(station.points).toHaveLength(0);
    }
    for (const station of stationsFor("drive", "big")) {
      expect(station.signs.length).toBeGreaterThanOrEqual(3);
      expect(station.points.map((p) => p.kind)).toEqual(["signal", "sign", "platform"]);
    }
  });

  it("三站各有一種窗外：田野、城市、海邊；隧道、鐵橋、對向列車都排在進站前", () => {
    for (const level of ["look", "drive", "captain"] as const) {
      for (const station of stationsFor(level)) {
        for (const span of [station.tunnel, station.bridge]) {
          if (span) expect(span.to).toBeLessThan(station.approachAt);
        }
        if (station.passAt !== null) expect(station.passAt).toBeLessThan(station.approachAt);
      }
    }
    expect(stationsFor("drive").map((s) => s.scene)).toEqual(["field", "city", "sea"]);
    expect(stationsFor("drive")[0]!.tunnel).not.toBeNull();
    expect(stationsFor("drive")[1]!.bridge).not.toBeNull();
    expect(stationsFor("look")[0]!.scene).toBe("sea");
  });

  it("小小司機：停進月台哪裡都是綠區", () => {
    const station = stationsFor("drive", "little")[0]!;
    expect(station.target - station.greenHalf).toBeLessThanOrEqual(station.window.start);
    expect(station.target + station.greenHalf).toBeGreaterThanOrEqual(station.window.end);
    const parked = withHook(createRun("drive", "little"), { progress: station.window.start + 0.01, speed: 0 });
    expect(parked.grades[0]).toBe("green");
  });
});

describe("速限牌與自動輕煞", () => {
  it("速度旗跟著經過的速限牌變，進站後不高於進站旗", () => {
    const base = createRun("drive", "big");
    const station = currentStation(base);
    const first = station.signs[0]!;
    expect(currentLimit(at(base, { progress: first.at - 0.01 }))).toBe(CRUISE_LIMIT);
    expect(currentLimit(at(base, { progress: first.at + 0.001 }))).toBe(first.limit);
    expect(currentLimit(at(base, { progress: station.approachAt }))).toBe(station.approachLimit);
    expect(nextSign(at(base, { progress: first.at - 0.05 }))).toEqual(first);
    expect(nextSign(at(base, { progress: first.at - 0.2 }))).toBeNull();
  });

  it("小小司機沒有牌子：路上都是巡航旗，進站才降", () => {
    const base = createRun("drive", "little");
    expect(currentLimit(at(base, { progress: 0.1 }))).toBe(CRUISE_LIMIT);
    expect(currentLimit(at(base, { progress: 0.31 }))).toBe(currentStation(base).approachLimit);
  });

  it("大司機超過速度旗：叮叮一次、自動輕煞到旗子下面就放開，不扣分", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[0]!;
    const fast = at(base, { progress: sign.at + 0.001, speed: 0.8, power: 4 });
    const first = step(fast, { type: "tick", dt: 0.05 });
    expect(first.autoBrake).toBe(true);
    expect(first.autoBrakeCount).toBe(1);
    expect(first.speed).toBeCloseTo(0.8 - AUTO_BRAKE_DECEL * 0.05, 5);
    const settled = run(first, 1.2);
    expect(settled.autoBrake).toBe(false);
    expect(settled.autoBrakeCount).toBe(1);
    expect(settled.speed).toBeLessThanOrEqual(currentLimit(settled) + 1e-6);
    const done = at(settled, { phase: "route-done", grades: ["green", "green", "green"] });
    expect(medalsFor(done, 0).stars).toBe(3);
  });

  it("推動力推不過速度旗，不會因此叮叮", () => {
    const base = at(createRun("drive", "big"), { progress: 0.01, speed: CRUISE_LIMIT - 0.005, power: 4 });
    const next = run(base, 0.3);
    expect(next.autoBrakeCount).toBe(0);
    expect(next.speed).toBeLessThanOrEqual(currentLimit(next) + 1e-6);
  });

  it("小小司機：旗子降下來時桿子自己收速度，不叮叮", () => {
    const base = at(createRun("drive", "little"), { progress: 0.31, speed: 0.8, power: 4 });
    const next = run(base, 0.5);
    expect(next.autoBrakeCount).toBe(0);
    expect(next.autoBrake).toBe(false);
    expect(next.speed).toBeLessThan(0.8);
  });
});

describe("窗外事件", () => {
  it("經過 passAt 對向列車出現，固定秒數後離開，一站只來一次", () => {
    const base = createRun("drive", "big");
    const slope = withHook(base, { stationIndex: 1, progress: 0.015, speed: 0.4 });
    const passAt = currentStation(slope).passAt!;
    expect(slope.passing).toBeNull();
    const started = run(at(slope, { power: 2 }), 0.3);
    expect(started.progress).toBeGreaterThan(passAt);
    expect(started.passing).not.toBeNull();
    const gone = run(started, PASS_DURATION + 0.2);
    expect(gone.passing).toBeNull();
    expect(gone.passedTrain).toBe(true);
  });

  it("隧道與鐵橋看進度判斷", () => {
    const base = createRun("drive", "big");
    const tunnel = currentStation(base).tunnel!;
    expect(inTunnel(at(base, { progress: (tunnel.from + tunnel.to) / 2 }))).toBe(true);
    expect(inTunnel(at(base, { progress: tunnel.to + 0.01 }))).toBe(false);
    const slope = withHook(base, { stationIndex: 1, progress: 0.15 });
    expect(onBridge(slope)).toBe(true);
  });

  it("鐵橋上按喇叭記一次打招呼；同一座橋再按不重複；橋外按不改狀態", () => {
    const base = createRun("drive", "big");
    const off = at(base, { progress: 0.02 });
    expect(step(off, { type: "honk" })).toBe(off);
    const bridge = withHook(base, { stationIndex: 1, progress: 0.15 });
    const greeted = step(bridge, { type: "honk" });
    expect(greeted.bridgeGreeted).toBe(true);
    expect(greeted.bridgeGreets).toBe(1);
    expect(step(greeted, { type: "honk" })).toBe(greeted);
  });

  it("換站時對向列車與鐵橋狀態重來", () => {
    const base = at(withHook(createRun("drive", "big"), { progress: 0.65, speed: 0 }), {
      phase: "doors-open",
      boarded: 1,
      bridgeGreeted: true,
      passedTrain: true,
    });
    const next = step(base, { type: "close-doors" });
    expect(next.stationIndex).toBe(1);
    expect(next.bridgeGreeted).toBe(false);
    expect(next.passedTrain).toBe(false);
    expect(next.passing).toBeNull();
  });
});

describe("指差確認", () => {
  it("出發時先確認號誌；按了就記一筆，同一題不重複", () => {
    const base = createRun("drive", "big");
    expect(pendingPoint(base)?.kind).toBe("signal");
    const done = step(base, { type: "point" });
    expect(done.pointsDone).toEqual(["orange-park-signal"]);
    expect(pendingPoint(done)).toBeNull();
    expect(step(done, { type: "point" })).toBe(done);
  });

  it("錯過不扣分，題目過了就安靜消失", () => {
    const base = at(createRun("drive", "big"), { progress: 0.3 });
    expect(pendingPoint(base)).toBeNull();
    const done = at(base, { phase: "route-done", grades: ["green", "green", "green"] });
    expect(medalsFor(done, 0).stars).toBe(3);
  });

  it("速限牌前與進站時各有一題；總題數三站加起來", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[0]!;
    expect(pendingPoint(at(base, { progress: sign.at }))?.kind).toBe("sign");
    expect(pendingPoint(at(base, { progress: currentStation(base).approachAt + 0.01 }))?.kind).toBe("platform");
    expect(pointTotal(base)).toBe(9);
    expect(pointTotal(createRun("drive", "little"))).toBe(0);
  });

  it("倒車或開門時不出題", () => {
    const base = createRun("drive", "big");
    expect(pendingPoint(at(base, { phase: "reversing" }))).toBeNull();
    expect(pendingPoint(at(base, { phase: "doors-open" }))).toBeNull();
  });
});
