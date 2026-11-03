import { describe, expect, it } from "vitest";
import { nextStationAnnouncement } from "@/lib/games/orange-express/announce";
import { COPY, EARLY_SLOW_RESULT, resultComment } from "@/lib/games/orange-express/copy";
import { xiaojuMood } from "@/lib/games/orange-express/mood";
import { speechCandidates, windowNotice } from "@/lib/games/orange-express/notice";
import {
  EARLY_SLOW_SLACK,
  PASS_DURATION,
  createRun,
  currentStation,
  pendingPoint,
  predictStop,
  signalRed,
  slowingSignAhead,
  step,
  withHook,
} from "@/lib/games/orange-express/reducer";
import { legStart } from "@/lib/games/orange-express/journey";
import { stationsFor } from "@/lib/games/orange-express/routes";
import type { RunState } from "@/lib/games/orange-express/types";

const DT = 1 / 60;

function tick(state: RunState, seconds: number, dt = DT): RunState {
  let s = state;
  for (let t = 0; t < seconds - 1e-9; t += dt) s = step(s, { type: "tick", dt });
  return s;
}

/** 小站長停好在第一站、朋友都上車了，關門就到第二站。 */
function captainLeavingPark(): RunState {
  const stopped = withHook(createRun("captain"), { progress: 0.65, speed: 0, brake: 3 });
  const open = step(stopped, { type: "open-doors" });
  return tick(open, 1);
}

describe("G2 小站長紅燈等對向列車", () => {
  it("只有小站長第二站起有紅燈，而且都是有對向列車的站", () => {
    expect(stationsFor("captain").map((s) => s.holdAtStart)).toEqual([false, true, true]);
    for (const station of stationsFor("captain")) {
      if (station.holdAtStart) expect(station.passAt).not.toBeNull();
    }
    for (const [level, driver] of [["drive", "big"], ["drive", "little"], ["look", "big"]] as const) {
      expect(stationsFor(level, driver).some((s) => s.holdAtStart)).toBe(false);
    }
  });

  it("關門換站：紅燈、對向列車馬上從遠方出現；開局第一站永遠綠燈", () => {
    expect(createRun("captain").signal).toBe("green");
    const next = step(captainLeavingPark(), { type: "close-doors" });
    expect(next.stationIndex).toBe(1);
    expect(next.signal).toBe("red");
    expect(next.passing).toBe(0);
    expect(next.passedTrain).toBe(true);
  });

  it("紅燈時推動力車不走、動力不作用；轉綠後已推著的動力照延遲起步，不必再推", () => {
    let s = step(captainLeavingPark(), { type: "close-doors" });
    s = step(step(s, { type: "set-brake", notch: 0 }), { type: "set-power", notch: 4 });
    expect(s.tractive).toBe(0);
    // PR-I4 起小站長從出站處（第一段風景段開頭，負的）等紅燈。
    const depart = s.progress;
    expect(depart).toBeCloseTo(legStart(currentStation(s)), 9);
    s = tick(s, 1.5);
    expect(signalRed(s)).toBe(true);
    expect(s.speed).toBe(0);
    expect(s.progress).toBe(depart);
    expect(s.tractive).toBe(0);
    s = tick(s, 2);
    expect(signalRed(s)).toBe(false);
    expect(s.power).toBe(4);
    expect(s.speed).toBeGreaterThan(0);
    expect(s.progress).toBeGreaterThan(depart);
  });

  it("轉綠那一刻動力先跳一點（跟剛推下去一樣），不是從 0 慢慢爬", () => {
    let s = step(captainLeavingPark(), { type: "close-doors" });
    s = step(step(s, { type: "set-brake", notch: 0 }), { type: "set-power", notch: 4 });
    while (signalRed(s)) s = step(s, { type: "tick", dt: DT });
    expect(s.tractive).toBeGreaterThan(0.1);
  });

  it("從關門到轉綠不超過 3 秒，車尾過去的同一刻轉綠", () => {
    let s = step(captainLeavingPark(), { type: "close-doors" });
    let t = 0;
    while (signalRed(s) && t < 5) {
      s = step(s, { type: "tick", dt: DT });
      t += DT;
    }
    expect(t).toBeLessThanOrEqual(3);
    expect(t).toBeGreaterThanOrEqual(PASS_DURATION - DT);
    expect(s.passing).toBeNull();
  });

  it("不雙重發車：轉綠後開過 passAt，對向列車不再來", () => {
    let s = step(captainLeavingPark(), { type: "close-doors" });
    s = step(step(s, { type: "set-brake", notch: 0 }), { type: "set-power", notch: 4 });
    s = tick(s, 3.2);
    expect(signalRed(s)).toBe(false);
    const passAt = currentStation(s).passAt!;
    while (s.progress <= passAt + 0.02) s = step(s, { type: "tick", dt: DT });
    expect(s.passing).toBeNull();
  });

  it("暫停時不送 tick：紅燈與對向列車都不前進", () => {
    const s = step(captainLeavingPark(), { type: "close-doors" });
    expect(step(s, { type: "tick", dt: 0 })).toBe(s);
  });

  it("紅燈時不出「號誌，綠燈！」，轉綠後才出", () => {
    let s = step(captainLeavingPark(), { type: "close-doors" });
    expect(pendingPoint(s)).toBeNull();
    s = tick(s, 3);
    expect(pendingPoint(s)?.kind).toBe("signal");
  });

  it("紅燈時前窗右上說紅燈（蓋過對向列車），朗讀不重念（已併在廣播）", () => {
    const s = step(captainLeavingPark(), { type: "close-doors" });
    expect(windowNotice(s, false)).toEqual({ kind: "red", text: COPY.redWait });
    expect(speechCandidates(s, false).some((item) => item.text === COPY.redWait)).toBe(false);
    expect(windowNotice(tick(s, 3), false)?.kind).not.toBe("red");
  });

  it("紅燈的站先預告對向列車，再報站名", () => {
    const [, slope] = stationsFor("captain");
    const item = nextStationAnnouncement(slope!);
    expect(item.text).toBe(`${COPY.redWaitAnnounce}。下一站，橘子坡站`);
    expect(item.id).toBe("next-orange-slope-wait");
    expect(nextStationAnnouncement(stationsFor("drive", "big")[1]!).text).toBe("下一站，橘子坡站");
  });

  it("紅燈時停車預測就是原地（出站處）", () => {
    const s = step(captainLeavingPark(), { type: "close-doors" });
    expect(predictStop(s)).toBe(s.progress);
  });

  it("withHook：跳站預設綠燈；寫 red 才從起點等，對向列車剛出現", () => {
    const base = createRun("captain");
    const jumped = withHook(base, { stationIndex: 1 });
    expect(jumped.signal).toBe("green");
    const red = withHook(base, { stationIndex: 2, signal: "red", progress: 0.3, speed: 0.4 });
    expect(red.signal).toBe("red");
    expect(red.progress).toBeCloseTo(legStart(red.stations[2]!), 9);
    expect(red.speed).toBe(0);
    expect(red.passing).toBe(0);
    expect(withHook(red, { stationIndex: 1 }).signal).toBe("green");
    expect(withHook(red, { progress: legStart(red.stations[2]!) }).signal).toBe("red");
  });
});

/** 小站長在進站速限牌前 at - lead 的地方，用這個速度與桿位（大司機 2026-11-01 起沒有速限牌）。 */
function captainBeforeApproach(lead: number, speed: number, power: number, brake: number): RunState {
  const base = createRun("captain");
  const at = currentStation(base).approachAt;
  return withHook(base, { progress: at - lead, speed, power, brake });
}

function crossApproach(state: RunState): RunState {
  const at = currentStation(state).approachAt;
  let s = state;
  while (s.progress < at + 0.001) s = step(s, { type: "tick", dt: DT });
  return s;
}

describe("G1 提前減速", () => {
  it("提示出現後先拉煞車、過牌時不太快：記一次", () => {
    const start = captainBeforeApproach(0.05, 0.6, 0, 3);
    expect(slowingSignAhead(start)?.at).toBe(currentStation(start).approachAt);
    const after = crossApproach(start);
    expect(after.speed).toBeLessThanOrEqual(currentStation(after).approachLimit * EARLY_SLOW_SLACK);
    expect(after.earlySlows).toBe(1);
    expect(after.slowPrep).toBeNull();
  });

  it("容得下延遲：過牌時比限速快一點點（≤1.1 倍）也算，自動輕煞照樣協助", () => {
    const limit = createRun("captain").stations[0]!.approachLimit;
    let s = captainBeforeApproach(0.05, limit * 1.06, 0, 0);
    s = crossApproach(s);
    expect(s.earlySlows).toBe(1);
  });

  it("一直推著動力：不算，自動輕煞來幫忙", () => {
    const after = tick(crossApproach(captainBeforeApproach(0.05, 0.6, 3, 0)), 0.1);
    expect(after.earlySlows).toBe(0);
    expect(after.autoBrakeCount).toBeGreaterThan(0);
  });

  it("放了動力但過牌時還太快：不算", () => {
    const after = crossApproach(captainBeforeApproach(0.03, 0.8, 0, 0));
    expect(after.earlySlows).toBe(0);
  });

  it("本來就比牌子慢（例如剛出發）：不算準備，不會白送", () => {
    const base = createRun("captain");
    const first = currentStation(base).signs[0]!;
    let s = withHook(base, { progress: first.at - 0.05, speed: first.limit * 0.8, power: 0, brake: 0 });
    while (s.progress < first.at + 0.001) s = step(s, { type: "tick", dt: DT });
    expect(s.earlySlows).toBe(0);
  });

  it("升速的牌子不算", () => {
    const base = createRun("captain");
    const raise = currentStation(base).signs[1]!;
    const s = withHook(base, { progress: raise.at - 0.03, speed: 0.6, power: 0, brake: 2 });
    expect(slowingSignAhead(s)).toBeNull();
  });

  it("大司機（2026-11-01 起）沒有速限牌，不算；事件上線前不會有提前慢下來", () => {
    const base = createRun("drive", "big");
    const s = withHook(base, { progress: currentStation(base).approachAt - 0.05, speed: 0.6, power: 0, brake: 3 });
    expect(slowingSignAhead(s)).toBeNull();
    expect(tick(s, 1).earlySlows).toBe(0);
  });

  it("低齡規則組沒有速限牌，不算", () => {
    const base = createRun("drive", "little");
    const s = withHook(base, { progress: 0.25, speed: 0.6, power: 0, brake: 3 });
    expect(slowingSignAhead(s)).toBeNull();
    expect(tick(s, 1).earlySlows).toBe(0);
  });

  it("跳站或換站清掉準備", () => {
    const start = captainBeforeApproach(0.05, 0.6, 0, 3);
    const prepped = step(start, { type: "tick", dt: DT });
    expect(prepped.slowPrep).not.toBeNull();
    expect(withHook(prepped, { stationIndex: 1 }).slowPrep).toBeNull();
  });

  it("結算一句話：小站長提前慢下來排第一；大司機沒有速限牌不說這句；低齡仍只用保底句", () => {
    const captain = { ...createRun("captain"), grades: ["green", "green", "green"] as const };
    expect(resultComment({ ...captain, earlySlows: EARLY_SLOW_RESULT, smoothStops: 3 })).toBe(COPY.resultEarlySlow);
    expect(resultComment({ ...captain, earlySlows: EARLY_SLOW_RESULT - 1, smoothStops: 3 })).toBe(COPY.resultSmooth);
    const big = { ...createRun("drive", "big"), grades: ["green", "green", "green"] as const };
    expect(resultComment({ ...big, earlySlows: EARLY_SLOW_RESULT, smoothStops: 3 })).toBe(COPY.resultSmooth);
    expect(resultComment({ ...big, course: "little", earlySlows: 6 })).toBe(COPY.resultLowAge);
  });

  it("做到的當下小橘開心（畫面計時一秒）", () => {
    const running = withHook(createRun("drive", "big"), { progress: 0.2, speed: 0.5 });
    expect(xiaojuMood(running)).toBe("calm");
    expect(xiaojuMood(running, true)).toBe("happy");
  });
});
