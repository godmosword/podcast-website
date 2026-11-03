import { describe, expect, it } from "vitest";
import { coachBeat } from "@/lib/games/orange-express/coach";
import {
  DUCK_OK,
  DUCK_ZONE,
  EVENT_SPOTS,
  RACE_WIN,
  WAVE_AFTER,
  activeEvent,
  eventKey,
  eventPending,
  eventPlan,
  eventsBefore,
  raceChasing,
  routeEvents,
  sectionEvent,
} from "@/lib/games/orange-express/events";
import { sectionStart } from "@/lib/games/orange-express/journey";
import { createRun, currentLimit, step, withHook } from "@/lib/games/orange-express/reducer";
import { SCENIC_LENGTH, stationsFor } from "@/lib/games/orange-express/routes";
import type { RunState, ScenicEventKind } from "@/lib/games/orange-express/types";

function tick(state: RunState, dt = 1 / 30): RunState {
  return step(state, { type: "tick", dt });
}

/** 一直開到 progress 過了 edge（或開了 seconds 秒）。 */
function driveTo(state: RunState, edge: number, seconds = 30): RunState {
  let s = state;
  for (let t = 0; t < seconds && s.progress < edge; t += 1 / 30) s = tick(s);
  return s;
}

/** 找一個種子，讓第 slot 格是 kind；回傳那一格所在的站與段。 */
function seedWith(kind: ScenicEventKind): { seed: number; stationIndex: number; section: number } {
  for (let seed = 0; seed < 200; seed += 1) {
    const events = routeEvents(stationsFor("drive", "big", seed));
    const found = events.find((event) => event.kind === kind && event.stationIndex > 0);
    if (found) return { seed, stationIndex: found.stationIndex, section: found.section };
  }
  throw new Error(`找不到 ${kind}`);
}

/** 停在那一段起點、巡航中（動力快）。 */
function cruiseInto(kind: ScenicEventKind, power = 4): RunState {
  const { seed, stationIndex, section } = seedWith(kind);
  return withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0.82, power });
}

describe("沿途事件：排法", () => {
  it("每個種子：五段各一件、四種都有、賽跑一次且只在出站後第一段、相鄰不重複", () => {
    for (let seed = 0; seed < 300; seed += 1) {
      const plan = eventPlan(seed);
      expect(plan).toHaveLength(5);
      for (const kind of ["ducks", "crossing", "wave", "race"] as const) expect(plan).toContain(kind);
      expect(plan.filter((kind) => kind === "race")).toHaveLength(1);
      expect([1, 3]).toContain(plan.indexOf("race"));
      expect(plan.some((kind, i) => i > 0 && plan[i - 1] === kind)).toBe(false);
    }
  });

  it("同一個種子排出同一趟；不同種子會有不同排法", () => {
    expect(eventPlan(7)).toEqual(eventPlan(7));
    const distinct = new Set(Array.from({ length: 40 }, (_, seed) => eventPlan(seed).join(",")));
    expect(distinct.size).toBeGreaterThan(5);
  });

  it("排進路線：大司機五段都有事件，其他規則組沒有；小鴨那段有看不到的降速區", () => {
    const stations = stationsFor("drive", "big", 3);
    const events = routeEvents(stations);
    expect(events.map((event) => event.kind)).toEqual(eventPlan(3));
    for (const station of stations) {
      const ducks = station.scenic.filter((section) => section.event?.kind === "ducks").length;
      expect(station.slowZones).toHaveLength(ducks);
    }
    expect(routeEvents(stationsFor("drive", "little"))).toEqual([]);
    expect(routeEvents(stationsFor("captain"))).toEqual([]);
  });

  it("提示比事件點早 4 秒（巡航）以上：聽完一句還有時間找桿子，也容得下作用延遲", () => {
    const cruise = 0.82 * 0.18;
    for (const kind of ["ducks", "crossing", "wave"] as const) {
      const spot = EVENT_SPOTS[kind];
      expect(((spot.at - spot.hint) * SCENIC_LENGTH) / cruise).toBeGreaterThan(4);
    }
  });

  it("小鴨：提示到降速區起點（真的要慢下來的最後一刻）巡航也有 3.5 秒以上", () => {
    const event = sectionEvent(cruiseInto("ducks"))!;
    expect(event.until).toBeCloseTo(event.at - DUCK_ZONE.before, 9);
    expect((event.until - event.hintAt) / (0.82 * 0.18)).toBeGreaterThan(3.5);
  });
});

describe("沿途事件：做到與遇到", () => {
  it("小鴨：提示後撥到慢，撥的當下不算；速度表真的掉下來才做到，算一次提前慢下來；降速區不響叮叮", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    s = driveTo(s, event.hintAt + 0.01);
    expect(eventPending(s)?.kind).toBe("ducks");
    s = tick(step(s, { type: "set-power", notch: 2 }));
    // 高速中撥到慢：還在快的速度，不算（astra 2026-11-03：原本這一刻就算做到）。
    expect(s.speed).toBeGreaterThan(DUCK_OK);
    expect(s.events[event.key]).toBeUndefined();
    while (s.speed > DUCK_OK) s = tick(s);
    expect(s.events[event.key]).toBe("done");
    expect(s.progress).toBeLessThan(event.until);
    expect(s.earlySlows).toBe(1);
    const before = s.autoBrakeCount;
    s = driveTo(s, event.at);
    expect(s.speed).toBeLessThanOrEqual(DUCK_ZONE.limit + 0.02);
    expect(s.autoBrakeCount).toBe(before);
  });

  it("小鴨：聽完提示（約 2 秒）才撥到慢、或放到鬆，也來得及在降速區前慢下來", () => {
    for (const notch of [2, 0] as const) {
      let s = cruiseInto("ducks");
      const event = sectionEvent(s)!;
      s = driveTo(s, event.hintAt);
      for (let t = 0; t < 2; t += 1 / 30) s = tick(s);
      s = step(s, { type: "set-power", notch });
      s = driveTo(s, event.until + 0.001);
      expect(s.events[event.key], `動力 ${notch}`).toBe("done");
    }
  });

  it("小鴨：一直推著快沒放，過了降速區起點記「遇到」；小橘照樣在小鴨前安靜地輕煞（不響叮叮、不算）", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    s = driveTo(s, event.until + 0.001);
    expect(s.events[event.key]).toBe("met");
    s = driveTo(s, event.at - 0.01);
    expect(s.speed).toBeLessThanOrEqual(DUCK_ZONE.limit + 0.02);
    expect(s.autoBrakeCount).toBe(0);
    expect(currentLimit(s)).toBe(DUCK_ZONE.limit);
    expect(s.earlySlows).toBe(0);
  });

  it("小鴨：開進降速區才放開動力來不及（那時是小橘在煞車），記「遇到」、不響叮叮", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    for (let i = 0; i < 2000 && s.progress <= event.until; i += 1) s = tick(s);
    expect(s.events[event.key]).toBe("met");
    const before = s.autoBrakeCount;
    s = tick(step(s, { type: "set-power", notch: 0 }));
    expect(s.events[event.key]).toBe("met");
    expect(s.autoBrakeCount).toBe(before);
  });

  it("提示還沒出現前就放開動力不記：要在提示之後；本來就慢慢開的，提示一出現就做到", () => {
    let s = cruiseInto("ducks", 0);
    const event = sectionEvent(s)!;
    expect(s.events[event.key]).toBeUndefined();
    s = tick(s);
    expect(s.progress).toBeLessThan(event.hintAt);
    expect(s.events[event.key]).toBeUndefined();
    // 動力一直放著（鬆也不會比慢快）：速度一路往慢的目標掉，提示出現後掉到 DUCK_OK 就做到。
    s = driveTo(s, event.hintAt + 0.001, 60);
    expect(s.speed).toBeGreaterThan(DUCK_OK);
    s = driveTo(s, event.until, 60);
    expect(s.events[event.key]).toBe("done");
    // 本來就慢慢開（提示出現時已經比 DUCK_OK 慢）：提示一出現就做到。
    let calm = withHook(s, { stationIndex: s.stationIndex, section: event.section, speed: 0.45, power: 2 });
    calm = driveTo(calm, event.hintAt + 0.001, 60);
    expect(calm.events[event.key]).toBe("done");
  });

  it("平交道：柵欄前按喇叭做到；事件點過了才按不算", () => {
    let s = cruiseInto("crossing");
    const event = sectionEvent(s)!;
    expect(step(s, { type: "honk" })).toBe(s);
    s = driveTo(s, event.hintAt + 0.01);
    const honked = step(s, { type: "honk" });
    expect(honked.events[event.key]).toBe("done");
    expect(step(honked, { type: "honk" })).toBe(honked);
    let late = driveTo(s, event.at + 0.01);
    expect(late.events[event.key]).toBe("met");
    late = step(late, { type: "honk" });
    expect(late.events[event.key]).toBe("met");
  });

  it("揮手的朋友：經過事件點後一小段按喇叭也算", () => {
    let s = cruiseInto("wave");
    const event = sectionEvent(s)!;
    expect(event.until).toBeCloseTo(event.at + WAVE_AFTER, 6);
    s = driveTo(s, event.at + 0.02);
    expect(s.events[event.key]).toBeUndefined();
    s = step(s, { type: "honk" });
    expect(s.events[event.key]).toBe("done");
  });

  it("賽跑：推到快只是開始追（不蓋章）；到終點夠快才記做到，一直在慢記遇到", () => {
    const { seed, stationIndex, section } = seedWith("race");
    const start = withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0, power: 0 });
    const event = sectionEvent(start)!;
    let slow = step(start, { type: "set-power", notch: 2 });
    slow = driveTo(slow, event.until + 0.01, 60);
    expect(slow.events[event.key]).toBe("met");
    let fast = tick(step(start, { type: "set-power", notch: 4 }));
    expect(raceChasing(fast, 4)).toBe(true);
    expect(fast.events[event.key]).toBeUndefined();
    fast = driveTo(fast, event.until - 0.01, 60);
    expect(fast.events[event.key]).toBeUndefined();
    fast = driveTo(fast, event.until + 0.001, 60);
    expect(fast.speed).toBeGreaterThanOrEqual(RACE_WIN);
    expect(fast.events[event.key]).toBe("done");
  });

  it("賽跑：推到快之後又緊急煞停，到終點追不上，記遇到（astra 2026-11-03：原本第一幀就算贏）", () => {
    const { seed, stationIndex, section } = seedWith("race");
    const start = withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0, power: 0 });
    const event = sectionEvent(start)!;
    let s = tick(step(start, { type: "set-power", notch: 4 }));
    s = driveTo(s, event.hintAt + 0.3, 60);
    s = step(step(s, { type: "set-power", notch: 0 }), { type: "set-brake", notch: 5 });
    for (let t = 0; t < 3; t += 1 / 30) s = tick(s);
    expect(s.speed).toBe(0);
    expect(raceChasing(s, 4)).toBe(false);
    s = step(step(s, { type: "set-brake", notch: 0 }), { type: "set-power", notch: 2 });
    s = driveTo(s, event.until + 0.001, 60);
    expect(s.events[event.key]).toBe("met");
  });

  it("賽跑：提示在出站那一刻；那時已經在「快」，到終點一樣算贏", () => {
    const { seed, stationIndex, section } = seedWith("race");
    const start = withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0.5, power: 4 });
    const event = sectionEvent(start)!;
    expect(event.hintAt).toBe(start.progress);
    expect(tick(start).events[event.key]).toBeUndefined();
    expect(driveTo(start, event.until + 0.001).events[event.key]).toBe("done");
  });

  it("前窗的事件：提示出現到事件點後一小段；站段沒有", () => {
    const s = cruiseInto("wave");
    const event = sectionEvent(s)!;
    expect(activeEvent(s)).toBeNull();
    expect(activeEvent({ ...s, progress: event.hintAt })?.key).toBe(event.key);
    expect(activeEvent({ ...s, progress: event.at + 0.05 })?.key).toBe(event.key);
    expect(activeEvent({ ...s, progress: 0.3 })).toBeNull();
  });
});

describe("沿途事件：生命週期", () => {
  it("每段一件、一段只結算一次；整趟開完五件都有結果", () => {
    let s = step(createRun("drive", "big", 5), { type: "set-power", notch: 4 });
    for (let i = 0; i < 20000 && s.phase !== "route-done"; i += 1) {
      const station = s.stations[s.stationIndex]!;
      if (s.phase === "stopped") s = step(s, { type: "open-doors" });
      else if (s.phase === "doors-open" && s.boarded >= station.passengers.length) {
        s = step(step(s, { type: "set-brake", notch: 0 }), { type: "close-doors" });
        s = step(s, { type: "set-power", notch: 4 });
      } else if (s.phase !== "doors-open" && s.brake === 0 && coachBeat(s) === "brake") {
        s = step(step(s, { type: "set-power", notch: 0 }), { type: "set-brake", notch: 3 });
      }
      s = tick(s);
    }
    expect(s.phase).toBe("route-done");
    expect(Object.keys(s.events)).toHaveLength(5);
    // 一直推著快：賽跑做到，其他都是遇到。
    const results = routeEvents(s.stations).map((event) => [event.kind, s.events[event.key]]);
    for (const [kind, result] of results) expect(result).toBe(kind === "race" ? "done" : "met");
  });

  it("掛鉤跳段：目的地這一段以後的結果清掉，之前的留著", () => {
    const events = { "0:0": "done", "1:0": "met", "1:1": "done", "2:0": "met" } as const;
    expect(eventsBefore(events, 1, 1)).toEqual({ "0:0": "done", "1:0": "met" });
    expect(eventsBefore(events, 3, 0)).toBe(events);
    const run = { ...createRun("drive", "big"), events };
    expect(withHook(run, { stationIndex: 1, section: 0 }).events).toEqual({ "0:0": "done" });
    expect(eventKey(2, 1)).toBe("2:1");
  });

  it("事件位置換成站的 progress：段起點＋段內位置", () => {
    const stations = stationsFor("drive", "big", 0);
    for (const event of routeEvents(stations)) {
      const station = stations[event.stationIndex]!;
      const spot = EVENT_SPOTS[event.kind];
      expect(event.at).toBeCloseTo(sectionStart(station, event.section) + spot.at * SCENIC_LENGTH, 9);
      expect(event.at).toBeLessThan(0);
    }
  });
});
