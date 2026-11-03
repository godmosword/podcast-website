import { describe, expect, it } from "vitest";
import { coachBeat } from "@/lib/games/orange-express/coach";
import { routeEvents } from "@/lib/games/orange-express/events";
import { nextAction, type NextContext } from "@/lib/games/orange-express/next-action";
import { createRun, currentStation, step, withHook } from "@/lib/games/orange-express/reducer";
import { stopBarFor } from "@/lib/games/orange-express/stop-target";
import type { DriverId, LevelId, RunState, ScenicEventKind } from "@/lib/games/orange-express/types";

const DT = 1 / 60;

function ctx(state: RunState, patch: Partial<NextContext> = {}): NextContext {
  return { mission: false, releaseHint: false, coachOn: false, beat: coachBeat(state), ...patch };
}

function next(state: RunState, patch: Partial<NextContext> = {}) {
  return nextAction(state, ctx(state, patch));
}

function tick(state: RunState, seconds: number): RunState {
  let s = state;
  for (let t = 0; t < seconds - 1e-9; t += DT) s = step(s, { type: "tick", dt: DT });
  return s;
}

/** 停在這一站的停車目標上（normalizePhase 會變成 stopped）。 */
function stoppedAt(level: LevelId, driver: DriverId = "big", stationIndex = 0): RunState {
  const base = createRun(level, driver);
  return withHook(base, { stationIndex, progress: base.stations[stationIndex]!.target, speed: 0, brake: 3 });
}

/** 進站點前一點、開著「快」：往前開到示範的 brake 拍那一刻。 */
function atBrakeBeat(level: LevelId, driver: DriverId, power = 4): RunState {
  const base = createRun(level, driver);
  let s = withHook(base, { progress: currentStation(base).approachAt - 0.02, speed: 0.7, power });
  while (coachBeat(s) !== "brake") s = step(s, { type: "tick", dt: DT });
  return s;
}

/** 種子 0 這一趟某種事件提示剛出來的時候。 */
function atEvent(driver: DriverId, level: LevelId, kind: ScenicEventKind, patch: { power: number; brake?: number }) {
  const base = createRun(level, driver, 0);
  const event = routeEvents(base.stations).find((e) => e.kind === kind)!;
  return withHook(base, { stationIndex: event.stationIndex, progress: event.hintAt + 0.01, speed: 0.6, ...patch });
}

describe("下一步：一次只亮一個（PR-J1）", () => {
  it("到家、倒車、紅燈等對向列車：什麼都不亮", () => {
    expect(next({ ...createRun("drive", "little"), phase: "route-done" })).toBeNull();
    expect(next({ ...createRun("drive", "little"), phase: "reversing" })).toBeNull();
    const red = withHook(createRun("captain"), { stationIndex: 1, signal: "red", power: 3, brake: 0 });
    expect(next(red)).toBeNull();
  });

  it("開局：任務卡還在時不亮（先聽完要接誰）；之後車停著、桿在 0 → 推動力出發（圖示桿面亮「慢」，小站長亮整根）", () => {
    const run = createRun("drive", "big");
    expect(next(run, { mission: true })).toBeNull();
    expect(next(run)).toMatchObject({ control: "power", notch: 2, dir: "up", reason: "start" });
    expect(next(createRun("drive", "little"))).toMatchObject({ control: "power", notch: 2, dir: "up", reason: "start" });
    // 慢慢看一開局動力就在「慢」，車自己會走：不亮。
    expect(next(createRun("look"))).toBeNull();
    const captain = withHook(createRun("captain"), { section: 0, speed: 0 });
    const afterSignal = step(captain, { type: "point" });
    expect(next(afterSignal)).toMatchObject({ control: "power", notch: null, dir: "up", reason: "start" });
  });

  it("小站長開局任務卡還在、號誌題已經有了：不亮（指差鈕要等卡片收起才出現），收起後亮指差", () => {
    const run = withHook(createRun("captain"), { section: 0, speed: 0 });
    expect(next(run, { mission: true })).toBeNull();
    expect(next(run)).toMatchObject({ control: "point" });
  });

  it("停好亮開門；開門後大司機先跟地標打招呼（不亮車門）、等上車不亮、都上車了才亮關門", () => {
    expect(next(stoppedAt("drive", "little"))).toMatchObject({ control: "door", reason: "open" });
    let s = step(stoppedAt("drive", "big"), { type: "open-doors" });
    expect(next(s)).toMatchObject({ control: "horn", reason: "greet" });
    s = step(s, { type: "honk" });
    expect(s.boarded).toBeLessThan(currentStation(s).passengers.length);
    expect(next(s)).toBeNull();
    s = tick(s, 3);
    expect(next(s)).toMatchObject({ control: "door", reason: "close" });
  });

  it("關門出站（動力 0、煞車還拉著）→ 推動力；推了煞車沒放、過了延遲 → 煞車「鬆」，延遲前不亮", () => {
    const leaving = withHook(createRun("drive", "big"), { stationIndex: 1, progress: 0, speed: 0, power: 0, brake: 3 });
    expect(next(leaving)).toMatchObject({ control: "power", reason: "start" });
    const pushed = step(leaving, { type: "set-power", notch: 2 });
    expect(next(pushed)).toBeNull();
    expect(next(pushed, { releaseHint: true })).toMatchObject({ control: "brake", notch: 0, dir: "down", reason: "release" });
  });

  it("停太早、倒車退好（還在進站區、車停著）→ 推動力，不亮煞車", () => {
    const base = createRun("captain");
    const short = withHook(base, { progress: currentStation(base).approachAt + 0.05, speed: 0, power: 0, brake: 0 });
    expect(short.phase).toBe("running");
    expect(next(short)).toMatchObject({ control: "power", reason: "start" });
  });

  it("小小司機、大司機：示範的 brake 拍那一刻亮「停」（之前不亮）；拉了就收", () => {
    for (const driver of ["little", "big"] as const) {
      const at = atBrakeBeat("drive", driver);
      expect(next(at)).toMatchObject({ control: "brake", notch: 3, dir: "up", reason: "brake" });
      const before = withHook(createRun("drive", driver), {
        progress: currentStation(at).approachAt + 0.01,
        speed: 0.7,
        power: 4,
      });
      expect(coachBeat(before)).toBe("watch");
      expect(next(before)).toBeNull();
      expect(next(step(at, { type: "set-brake", notch: 3 }))).toBeNull();
    }
  });

  it("照亮的那一刻拉「停」：小小司機、大司機推「慢」或「快」進站都停在綠區", () => {
    for (const driver of ["little", "big"] as const) {
      for (const power of [2, 4]) {
        let s = atBrakeBeat("drive", driver, power);
        s = step(step(s, { type: "set-power", notch: 0 }), { type: "set-brake", notch: 3 });
        while (s.phase !== "stopped") s = step(s, { type: "tick", dt: DT });
        expect(s.grades[0], `${driver} P${power}`).toBe("green");
      }
    }
  });

  it("大司機已經拉「輕」、預測會停在綠區：不再亮「停」（不教掉輕輕停）", () => {
    const base = createRun("drive", "big");
    const station = currentStation(base);
    let found = 0;
    for (const speed of [0.45, 0.6, 0.75]) {
      for (let p = station.approachAt; p < station.window.end; p += 0.004) {
        const s = withHook(base, { progress: p, speed, power: 0, brake: 2 });
        if (s.phase !== "running" && s.phase !== "in-window") continue;
        if (stopBarFor(s)?.predictedGrade !== "green") continue;
        found += 1;
        expect(next(s)?.reason).not.toBe("brake");
      }
    }
    expect(found).toBeGreaterThan(0);
  });

  it("慢慢看進站不亮（小橘幫忙停）；小站長進站亮整根煞車桿、拉了就收，示範那幾趟照時機亮 B3", () => {
    const look = createRun("look");
    expect(next(withHook(look, { progress: currentStation(look).approachAt + 0.02, speed: 0.5, power: 2 }))).toBeNull();
    const captain = createRun("captain");
    const coming = withHook(captain, { progress: currentStation(captain).approachAt + 0.01, speed: 0.6, power: 3 });
    expect(next(coming)).toMatchObject({ control: "brake", notch: null, reason: "brake-ready" });
    expect(next(step(coming, { type: "set-brake", notch: 1 }))).toBeNull();
    const beat = atBrakeBeat("captain", "big", 3);
    expect(next(beat, { coachOn: true })).toMatchObject({ control: "brake", notch: 3, reason: "brake" });
  });

  it("小站長：號誌題排在推動力前面；停好時月台題還在就先亮指差，按了才亮開門", () => {
    const leaving = withHook(createRun("captain"), { stationIndex: 1, section: 0, signal: "green", speed: 0, power: 0 });
    expect(next(leaving)).toMatchObject({ control: "point", reason: "point" });
    let s = stoppedAt("captain");
    expect(s.phase).toBe("stopped");
    expect(next(s)).toMatchObject({ control: "point" });
    s = step(s, { type: "point" });
    expect(next(s)).toMatchObject({ control: "door", reason: "open" });
    // 示範那一站不出月台題：直接開門。
    expect(next(stoppedAt("captain"), { coachOn: true })).toMatchObject({ control: "door" });
  });

  it("沿途事件：小鴨亮「慢」（小站長亮煞車 B2）、賽跑亮最快、平交道與揮手亮喇叭；已經在那一格不亮", () => {
    expect(next(atEvent("big", "drive", "ducks", { power: 4 }))).toMatchObject({ control: "power", notch: 2, dir: "down" });
    expect(next(atEvent("big", "drive", "ducks", { power: 2 }))).toBeNull();
    expect(next(atEvent("big", "drive", "race", { power: 2 }))).toMatchObject({ control: "power", notch: 4, dir: "up" });
    expect(next(atEvent("big", "drive", "crossing", { power: 4 }))).toMatchObject({ control: "horn", reason: "event" });
    expect(next(atEvent("big", "drive", "wave", { power: 4 }))).toMatchObject({ control: "horn" });
    expect(next(atEvent("big", "captain", "ducks", { power: 3 }))).toMatchObject({ control: "brake", notch: 2 });
  });

  it("小站長小鴨過了、煞車還拉著：亮「鬆」", () => {
    const s = atEvent("big", "captain", "ducks", { power: 0, brake: 2 });
    const event = routeEvents(s.stations).find((e) => e.kind === "ducks")!;
    const done = { ...s, events: { ...s.events, [event.key]: "done" as const } };
    expect(next(done)).toMatchObject({ control: "brake", notch: 0, reason: "after-ducks" });
  });

  it("小站長在鐵橋上還沒打招呼：亮喇叭；巡航時什麼都不亮", () => {
    const base = createRun("captain");
    const index = base.stations.findIndex((st) => st.bridge !== null);
    const bridge = base.stations[index]!.bridge!;
    const on = withHook(base, { stationIndex: index, progress: (bridge.from + bridge.to) / 2, speed: 0.6, power: 3 });
    expect(next(on)).toMatchObject({ control: "horn", reason: "bridge" });
    expect(next(step(on, { type: "honk" }))).toBeNull();
  });
});
