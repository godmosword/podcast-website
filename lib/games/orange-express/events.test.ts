import { describe, expect, it } from "vitest";
import { coachBeat } from "@/lib/games/orange-express/coach";
import {
  DUCK_ZONE,
  EVENT_SPOTS,
  WAVE_AFTER,
  activeEvent,
  eventKey,
  eventPending,
  eventPlan,
  eventsBefore,
  routeEvents,
  sectionEvent,
} from "@/lib/games/orange-express/events";
import { sectionStart } from "@/lib/games/orange-express/journey";
import { createRun, currentLimit, step, withHook } from "@/lib/games/orange-express/reducer";
import { stationsFor } from "@/lib/games/orange-express/routes";
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

  it("提示比事件點早約 3 秒（巡航）以上，容得下作用延遲", () => {
    const cruise = 0.82 * 0.18;
    for (const kind of ["ducks", "crossing", "wave"] as const) {
      const spot = EVENT_SPOTS[kind];
      expect((spot.at - spot.hint) / cruise).toBeGreaterThan(3);
    }
  });
});

describe("沿途事件：做到與遇到", () => {
  it("小鴨：提示後放開動力就做到，算一次提前慢下來；降速區裡照樣輕煞但不響叮叮", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    s = driveTo(s, event.hintAt + 0.01);
    expect(eventPending(s)?.kind).toBe("ducks");
    s = step(s, { type: "set-power", notch: 0 });
    s = tick(s);
    expect(s.events[event.key]).toBe("done");
    expect(s.earlySlows).toBe(1);
    const before = s.autoBrakeCount;
    s = driveTo(s, event.at);
    expect(s.speed).toBeLessThanOrEqual(DUCK_ZONE.limit + 0.02);
    expect(s.autoBrakeCount).toBe(before);
  });

  it("小鴨：一直推著快沒放，過了事件點記「遇到」；小橘照樣在小鴨前安靜地輕煞（不響叮叮、不算）", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    s = driveTo(s, event.at - 0.01);
    expect(s.speed).toBeLessThanOrEqual(DUCK_ZONE.limit + 0.02);
    expect(s.autoBrakeCount).toBe(0);
    expect(currentLimit(s)).toBe(DUCK_ZONE.limit);
    s = driveTo(s, event.at + 0.01);
    expect(s.events[event.key]).toBe("met");
    expect(s.earlySlows).toBe(0);
  });

  it("小鴨：從「快」拉到「慢」也算慢下來（桿子上寫著慢）", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    s = driveTo(s, event.hintAt + 0.01);
    s = tick(step(s, { type: "set-power", notch: 2 }));
    expect(s.events[event.key]).toBe("done");
  });

  it("提示還沒出現前就放開動力不算：要在提示之後", () => {
    let s = cruiseInto("ducks", 0);
    const event = sectionEvent(s)!;
    expect(s.events[event.key]).toBeUndefined();
    s = tick(s);
    expect(s.progress).toBeLessThan(event.hintAt);
    expect(s.events[event.key]).toBeUndefined();
    // 動力一直放著：提示一出現就算做到（孩子已經在慢慢開）。
    s = driveTo(s, event.hintAt + 0.001, 60);
    s = tick(s);
    expect(s.events[event.key]).toBe("done");
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

  it("賽跑：提示後推到「快」做到；一直在「慢」就記遇到", () => {
    const { seed, stationIndex, section } = seedWith("race");
    const start = withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0, power: 0 });
    const event = sectionEvent(start)!;
    let slow = step(start, { type: "set-power", notch: 2 });
    slow = driveTo(slow, event.until + 0.01, 60);
    expect(slow.events[event.key]).toBe("met");
    let fast = step(start, { type: "set-power", notch: 4 });
    fast = driveTo(fast, event.hintAt + 0.01);
    fast = tick(fast);
    expect(fast.events[event.key]).toBe("done");
  });

  it("賽跑：提示在出站那一刻；那時已經在「快」也算贏（車已經跑最快）", () => {
    const { seed, stationIndex, section } = seedWith("race");
    const start = withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0.5, power: 4 });
    const event = sectionEvent(start)!;
    expect(event.hintAt).toBe(start.progress);
    expect(tick(start).events[event.key]).toBe("done");
  });

  it("小鴨：做到的那一幀剛好開進降速區，自動輕煞同一幀也不算、不響", () => {
    let s = cruiseInto("ducks");
    const event = sectionEvent(s)!;
    const zoneFrom = event.at - DUCK_ZONE.before;
    // 推著快開進降速區（這一幀還沒輕煞），下一幀才放開動力：同一幀做到、輕煞開始。
    for (let i = 0; i < 2000 && s.progress < zoneFrom; i += 1) s = tick(s);
    expect(s.progress).toBeGreaterThanOrEqual(zoneFrom);
    expect(s.autoBrake).toBe(false);
    expect(s.events[event.key]).toBeUndefined();
    const before = s.autoBrakeCount;
    s = tick(step(s, { type: "set-power", notch: 0 }));
    expect(s.events[event.key]).toBe("done");
    expect(s.autoBrake).toBe(true);
    expect(s.autoBrakeCount).toBe(before);
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
      expect(event.at).toBeCloseTo(sectionStart(station, event.section) + spot.at, 9);
      expect(event.at).toBeLessThan(0);
    }
  });
});
