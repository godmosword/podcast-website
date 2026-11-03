import { describe, expect, it } from "vitest";
import { speedToAngle } from "@/lib/games/orange-express/gauge";
import {
  AUTO_BRAKE_DECEL,
  BRAKE_ACCEL,
  EFFORT_KICK,
  EFFORT_LAG,
  POWER_ACCEL,
  SLOW_CRUISE,
  effortNotch,
  netAccel,
  slowCap,
} from "@/lib/games/orange-express/physics";
import {
  PREDICT_DT,
  createRun,
  currentStation,
  predictStop,
  step,
  withHook,
} from "@/lib/games/orange-express/reducer";
import { COURSE_RULES, stopEpsilon } from "@/lib/games/orange-express/routes";
import { EMERGENCY, type CourseId, type LevelId, type RunState } from "@/lib/games/orange-express/types";

const RUNS: Record<CourseId, () => RunState> = {
  look: () => createRun("look"),
  little: () => createRun("drive", "little"),
  big: () => createRun("drive", "big"),
  captain: () => createRun("captain"),
};

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

function tick(state: RunState, seconds: number, dt = 1 / 60): RunState {
  let next = state;
  for (let t = 0; t < seconds - 1e-9; t += dt) next = step(next, { type: "tick", dt });
  return next;
}

function runUntil(state: RunState, done: (s: RunState) => boolean, dt: number, limit = 2000): RunState {
  let next = state;
  for (let i = 0; i < limit && !done(next); i += 1) next = step(next, { type: "tick", dt });
  return next;
}

describe("作用的時間常數（D1）", () => {
  it("慢慢看全部 0；越大的司機越重；煞車上升不慢於動力", () => {
    expect(EFFORT_LAG.look).toEqual({ power: 0, brakeRise: 0, brakeRelease: 0 });
    expect(EFFORT_LAG.little.power).toBeLessThan(EFFORT_LAG.big.power);
    expect(EFFORT_LAG.big.power).toBeLessThan(EFFORT_LAG.captain.power);
    for (const course of ["little", "big", "captain"] as const) {
      expect(EFFORT_LAG[course].brakeRise).toBeLessThanOrEqual(EFFORT_LAG[course].power);
    }
  });

  it("推了動力：作用先跳到目標的 35%，然後一階延遲跟上；慢慢看立刻全力", () => {
    const big = step(RUNS.big(), { type: "set-power", notch: 2 });
    expect(big.tractive).toBeCloseTo(POWER_ACCEL[2] * EFFORT_KICK, 6);
    const later = tick(big, EFFORT_LAG.big.power);
    // 一個時間常數後剩下的差距約是 e^-1。
    const gap = (POWER_ACCEL[2] - later.tractive) / (POWER_ACCEL[2] * (1 - EFFORT_KICK));
    expect(gap).toBeGreaterThan(0.3);
    expect(gap).toBeLessThan(0.42);
    const settled = tick(later, 1.5);
    expect(settled.autoBrake).toBe(false);
    expect(settled.tractive).toBeCloseTo(POWER_ACCEL[2], 2);

    const look = step(at(RUNS.look(), { power: 0, tractive: 0 }), { type: "set-power", notch: 2 });
    expect(look.tractive).toBe(POWER_ACCEL[2]);
  });

  it("從停住推最小那格（大司機 P2「慢」、小站長 P1）：大司機 300ms、小站長 400ms 內指針離開 0 至少 3°", () => {
    for (const [course, ms, notch] of [
      ["big", 300, 2],
      ["captain", 400, 1],
    ] as const) {
      const moving = tick(step(RUNS[course](), { type: "set-power", notch }), ms / 1000);
      expect(moving.power).toBe(notch);
      expect(speedToAngle(moving.speed) - speedToAngle(0)).toBeGreaterThanOrEqual(3);
    }
  });

  it("放開動力也有延遲（車還在推一下），放開煞車用比較短的放開時間", () => {
    const pushing = withHook(RUNS.big(), { power: 4, speed: 0.3, progress: 0.2 });
    const eased = step(pushing, { type: "set-power", notch: 0 });
    expect(eased.tractive).toBeCloseTo(POWER_ACCEL[4] * (1 - EFFORT_KICK), 6);

    const held = withHook(RUNS.captain(), { brake: 3, speed: 0.3, progress: 0.2 });
    const released = step(held, { type: "set-brake", notch: 0 });
    expect(released.braking).toBeCloseTo(BRAKE_ACCEL[3] * (1 - EFFORT_KICK), 6);
    const after = tick(released, EFFORT_LAG.captain.brakeRelease);
    expect(after.braking / released.braking).toBeLessThan(0.42);
  });
});

describe("作用的同步與歸零", () => {
  it("煞車一拉動力立刻斷；緊急煞車立刻全力", () => {
    const pushing = withHook(RUNS.big(), { power: 4, speed: 0.3, progress: 0.2 });
    const braked = step(pushing, { type: "set-brake", notch: 2 });
    expect(braked.tractive).toBe(0);
    expect(braked.braking).toBeCloseTo(BRAKE_ACCEL[2] * EFFORT_KICK, 6);
    expect(netAccel(braked)).toBeLessThan(0);

    const emergency = step(pushing, { type: "set-brake", notch: EMERGENCY });
    expect(emergency.tractive).toBe(0);
    expect(emergency.braking).toBe(BRAKE_ACCEL[EMERGENCY]);
    expect(tick(emergency, 0.05).braking).toBe(BRAKE_ACCEL[EMERGENCY]);
  });

  it("自動輕煞：觸發那一幀動力歸零、輕煞立刻作用；放開時煞車回桿位", () => {
    const fast = withHook(RUNS.big(), { power: 4, speed: 0.9, progress: 0.2 });
    expect(COURSE_RULES.big.autoBrake).toBe(true);
    const next = step(fast, { type: "tick", dt: 1 / 60 });
    expect(next.autoBrake).toBe(true);
    expect(next.autoBrakeCount).toBe(fast.autoBrakeCount + 1);
    expect(next.tractive).toBe(0);
    expect(next.braking).toBeGreaterThanOrEqual(AUTO_BRAKE_DECEL);
    const done = runUntil(next, (s) => !s.autoBrake, 1 / 60);
    expect(done.braking).toBe(0);
  });

  it("開局、停好、開過頭倒車、倒車回來、出站：動力歸零，煞車就是桿位", () => {
    const fresh = RUNS.captain();
    expect([fresh.tractive, fresh.braking]).toEqual([0, 0]);

    const station = currentStation(RUNS.big());
    const stopped = runUntil(
      withHook(RUNS.big(), { brake: 3, speed: 0.2, progress: station.window.start }),
      (s) => s.phase === "stopped",
      1 / 60,
    );
    expect(stopped.phase).toBe("stopped");
    expect([stopped.tractive, stopped.braking]).toEqual([0, BRAKE_ACCEL[3]]);

    const overrun = runUntil(
      withHook(RUNS.big(), { power: 2, speed: 0.4, progress: station.window.end - 0.01 }),
      (s) => s.phase === "reversing",
      1 / 60,
    );
    expect(overrun.phase).toBe("reversing");
    expect(overrun.tractive).toBe(0);
    const back = runUntil(overrun, (s) => s.phase !== "reversing", 1 / 60);
    expect(back.phase).toBe("running");
    expect([back.tractive, back.braking]).toEqual([0, BRAKE_ACCEL[back.brake]]);

    let doors = step(stopped, { type: "open-doors" });
    doors = tick(doors, 3);
    const leaving = step(doors, { type: "close-doors" });
    expect(leaving.stationIndex).toBe(1);
    expect([leaving.tractive, leaving.braking]).toEqual([0, BRAKE_ACCEL[leaving.brake]]);
  });

  it("測試的 jump 給桿位時作用直接到位；沒給桿位就保留", () => {
    const jumped = withHook(RUNS.captain(), { power: 3 });
    expect(jumped.tractive).toBe(POWER_ACCEL[3]);
    const braked = withHook(jumped, { brake: 2 });
    expect([braked.tractive, braked.braking]).toEqual([0, BRAKE_ACCEL[2]]);
    const moved = withHook(at(jumped, { tractive: 0.1 }), { progress: 0.3 });
    expect(moved.tractive).toBe(0.1);
  });
});

describe("停車預測跟真的停點一樣", () => {
  type Case = { name: string; level: LevelId; driver?: "little" | "big"; patch: Partial<RunState>; brakeTo?: number };
  // 第一站：大司機區間 0.5–0.8、小站長 0.58–0.72、小小司機 0.42–0.88、慢慢看 0.36–0.92。
  const station = currentStation(RUNS.big());
  const cases: Case[] = [
    { name: "大司機窗前拉「輕」（B2）、停進區間", level: "drive", patch: { progress: 0.47, speed: 0.4 }, brakeTo: 2 },
    { name: "大司機拉太早、停在區間前", level: "drive", patch: { progress: 0.4, speed: 0.4 }, brakeTo: 2 },
    { name: "大司機窗內拉 B2", level: "drive", patch: { progress: 0.55, speed: 0.3, phase: "in-window" }, brakeTo: 2 },
    { name: "小站長窗內拉 B1（作用還在爬）", level: "captain", patch: { progress: 0.58, speed: 0.33, phase: "in-window" }, brakeTo: 1 },
    { name: "小小司機拉停", level: "drive", driver: "little", patch: { progress: 0.45, speed: 0.4, phase: "in-window" }, brakeTo: 3 },
    { name: "剛好慢到門檻", level: "drive", patch: { progress: 0.52, speed: stopEpsilon("big") + 0.01, phase: "in-window" }, brakeTo: 2 },
    { name: "慢慢看進站爬行", level: "look", patch: { progress: 0.4, speed: 0.1, phase: "in-window" }, brakeTo: 3 },
  ];
  const settled = (s: RunState) => s.phase === "stopped" || s.phase === "reversing" || s.speed === 0;

  for (const c of cases) {
    it(`${c.name}：同一步長逐幀跑，誤差 < 0.005；60fps 誤差 < 0.01`, () => {
      const base = createRun(c.level, c.driver ?? "big");
      const braked = step(at(base, { ...c.patch, power: 0 }), { type: "set-brake", notch: c.brakeTo ?? 0 });
      const predicted = predictStop(braked);
      expect(predicted).not.toBeNull();
      for (const [dt, tolerance] of [
        [PREDICT_DT, 0.005],
        [1 / 60, 0.01],
      ] as const) {
        const real = runUntil(braked, settled, dt);
        expect(real.phase).not.toBe("reversing");
        expect(real.speed === 0 || real.phase === "stopped").toBe(true);
        expect(Math.abs(real.progress - predicted!)).toBeLessThan(tolerance);
      }
    });
  }

  it("會開過頭：預測點在窗尾後面（畫面顯示超過），真的會倒車", () => {
    const captain = RUNS.captain();
    const end = currentStation(captain).window.end;
    const fast = step(at(captain, { progress: 0.68, speed: 0.35, phase: "in-window" }), { type: "set-brake", notch: 1 });
    const predicted = predictStop(fast)!;
    expect(predicted).toBeGreaterThan(end);
    const real = runUntil(fast, settled, PREDICT_DT);
    expect(real.phase).toBe("reversing");
  });

  it("換桿那一幀預測點就動；推動力、滑行時不畫", () => {
    const rolling = withHook(RUNS.big(), { progress: station.approachAt + 0.05, speed: 0.3 });
    expect(predictStop(rolling)).toBeNull();
    expect(predictStop(step(rolling, { type: "set-power", notch: 2 }))).toBeNull();
    const b2 = step(rolling, { type: "set-brake", notch: 2 });
    const b3 = step(b2, { type: "set-brake", notch: 3 });
    expect(predictStop(b2)).not.toBeNull();
    expect(predictStop(b3)!).toBeLessThan(predictStop(b2)!);
  });
});

describe("圖示桿面的「慢」有自己的目標速度（PR-I1）", () => {
  it("從停著一直推慢，穩在慢的目標；推快才到巡航上限", () => {
    for (const course of ["little", "big"] as const) {
      // 進站點挪遠，只看桿子本身（進站速度旗會把快也壓下來）。
      const run = withHook(RUNS[course](), { progress: 0, speed: 0 });
      const start = { ...run, stations: run.stations.map((st) => ({ ...st, approachAt: 9 })) };
      const slow = tick(step(start, { type: "set-power", notch: 2 }), 4);
      expect(slow.speed, course).toBeLessThanOrEqual(SLOW_CRUISE[course]! + 1e-6);
      expect(slow.speed, course).toBeGreaterThan(SLOW_CRUISE[course]! - 0.02);
      const fast = tick(step(start, { type: "set-power", notch: 4 }), 4);
      expect(fast.speed, course).toBeGreaterThan(0.75);
    }
  });

  it("從快撥到慢：1.6 秒內速度表掉到 0.5 以下，不響叮叮、不算自動輕煞", () => {
    for (const course of ["little", "big"] as const) {
      const cruising = withHook(RUNS[course](), { progress: 0, speed: 0.82, power: 4 });
      const slowed = tick(step(cruising, { type: "set-power", notch: 2 }), 1.6);
      expect(slowed.speed, course).toBeLessThanOrEqual(0.5);
      expect(slowed.autoBrake, course).toBe(false);
      expect(slowed.autoBrakeCount, course).toBe(0);
      // 降到目標就停在那裡，不會一路掉到停。
      expect(tick(slowed, 2).speed, course).toBeCloseTo(SLOW_CRUISE[course]!, 3);
    }
  });

  it("鬆不會比慢快：從快放到鬆一樣降到慢的目標，之後才是平常的滑行", () => {
    const cruising = withHook(RUNS.big(), { progress: 0, speed: 0.82, power: 4 });
    const loose = tick(step(cruising, { type: "set-power", notch: 0 }), 2);
    expect(loose.speed).toBeLessThanOrEqual(SLOW_CRUISE.big!);
    expect(loose.autoBrakeCount).toBe(0);
  });

  it("撥慢時開進進站點：照樣降到進站速度旗（大司機 0.4）以下，自動輕煞只觸發一次、不來回跳；預測照樣準", () => {
    const station = currentStation(RUNS.big());
    const entering = withHook(RUNS.big(), { progress: station.approachAt - 0.02, speed: 0.82, power: 2 });
    let s = entering;
    let flips = 0;
    let under = false;
    for (let t = 0; t < 3; t += 1 / 60) {
      const next = tick(s, 1 / 60);
      if (next.autoBrake !== s.autoBrake) flips += 1;
      // 降到旗子以下之後，慢的上限不會把速度撐回旗子上面。
      if (under) expect(next.speed).toBeLessThanOrEqual(station.approachLimit + 1e-6);
      if (next.speed <= station.approachLimit) under = true;
      s = next;
    }
    expect(under).toBe(true);
    expect(s.autoBrakeCount).toBe(1);
    expect(flips).toBe(2);

    // 小小司機沒有自動輕煞：進站旗 0.45 跟慢的目標一樣，從快撥慢照樣收到旗子以下。
    const little = currentStation(RUNS.little());
    const lit = tick(withHook(RUNS.little(), { progress: little.approachAt - 0.02, speed: 0.82, power: 2 }), 3);
    expect(lit.speed).toBeLessThanOrEqual(little.approachLimit + 1e-6);

    // 撥慢、進站中拉停：預測點跟真的停點一樣。
    const braked = step(withHook(RUNS.big(), { progress: station.approachAt + 0.05, speed: 0.6, power: 2 }), {
      type: "set-brake",
      notch: 3,
    });
    const predicted = predictStop(braked)!;
    const real = runUntil(braked, (x) => x.phase === "stopped" || x.phase === "reversing" || x.speed === 0, PREDICT_DT);
    expect(Math.abs(real.progress - predicted)).toBeLessThan(0.005);
  });

  it("拉煞車比慢降得快時照煞車；慢慢看與小站長沒有慢的目標", () => {
    const cruising = withHook(RUNS.big(), { progress: 0, speed: 0.82, power: 2 });
    const braked = tick(step(cruising, { type: "set-brake", notch: 3 }), 0.5);
    const eased = tick(cruising, 0.5);
    expect(braked.speed).toBeLessThan(eased.speed);
    expect(slowCap("captain", 2)).toBeNull();
    expect(slowCap("look", 2)).toBeNull();
    expect(slowCap("big", 4)).toBeNull();
    expect(slowCap("little", 0)).toBe(SLOW_CRUISE.little);
  });
});

describe("桿槽填色的位置", () => {
  it("作用換成桿上的格（可以有小數），超出夾在最後一格", () => {
    expect(effortNotch(POWER_ACCEL, 0)).toBe(0);
    expect(effortNotch(POWER_ACCEL, POWER_ACCEL[2])).toBe(2);
    expect(effortNotch(POWER_ACCEL, (POWER_ACCEL[2] + POWER_ACCEL[3]) / 2)).toBeCloseTo(2.5, 6);
    expect(effortNotch(BRAKE_ACCEL, BRAKE_ACCEL[EMERGENCY])).toBe(EMERGENCY);
    expect(effortNotch(BRAKE_ACCEL, 9)).toBe(EMERGENCY);
  });
});
