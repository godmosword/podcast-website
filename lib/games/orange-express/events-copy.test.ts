import { describe, expect, it } from "vitest";
import { chimeWithinLimits, CROSSING_BELL, AUTO_BRAKE_DING } from "@/lib/games/orange-express/chime";
import { missionNames } from "@/components/games/OrangeExpressMissionCard";
import { eventHint, missionLine, resultComment } from "@/lib/games/orange-express/copy";
import { cheerFor, routeEvents, sectionEvent } from "@/lib/games/orange-express/events";
import { eventSpeech, nextSpeech, windowNotice } from "@/lib/games/orange-express/notice";
import { createRun, step, withHook } from "@/lib/games/orange-express/reducer";
import { stationsFor } from "@/lib/games/orange-express/routes";
import { crossingLamps, duckCross, duckXs, raceGap, RACE_AHEAD } from "@/lib/games/orange-express/windshield-events";
import type { RunState, ScenicEventKind } from "@/lib/games/orange-express/types";

function seedFor(kind: ScenicEventKind): { seed: number; stationIndex: number; section: number } {
  for (let seed = 0; seed < 200; seed += 1) {
    const found = routeEvents(stationsFor("drive", "big", seed)).find((event) => event.kind === kind);
    if (found) return { seed, stationIndex: found.stationIndex, section: found.section };
  }
  throw new Error(kind);
}

function atHint(kind: ScenicEventKind): RunState {
  const { seed, stationIndex, section } = seedFor(kind);
  const run = withHook(createRun("drive", "big", seed), { stationIndex, section, speed: 0.6, power: 4 });
  const event = sectionEvent(run)!;
  return { ...run, progress: event.hintAt + 0.01 };
}

describe("沿途事件：文案", () => {
  it("提示依場景換動物：海邊是螃蟹與海鷗、城市賽跑是小狗", () => {
    expect(eventHint("ducks", "field")).toBe("小鴨要過鐵軌，慢下來");
    expect(eventHint("ducks", "sea")).toBe("螃蟹要過鐵軌，慢下來");
    expect(eventHint("race", "city")).toBe("跟小狗賽跑，推到快");
    expect(eventHint("race", "sea")).toBe("跟海鷗賽跑，推到快");
    expect(eventHint("crossing", "city")).toBe("平交道，按喇叭");
  });

  it("任務卡那句", () => {
    expect(missionLine(["Bonbon", "小南", "馬米"])).toBe("今天要去接Bonbon、小南、馬米回家");
    // 小站長有名字的朋友跟大司機同站，那句一樣；多接的兩位不印名字、不念。
    expect(missionLine(missionNames(stationsFor("captain")))).toBe("今天要去接Bonbon、小南、馬米回家");
  });

  it("結算一句話優先說事件：小動物過鐵軌每次都做到時說它；都沒做到就照舊", () => {
    const run = createRun("drive", "big", 4);
    const events = routeEvents(run.stations);
    const ducks = events.filter((event) => event.kind === "ducks");
    const allDucks = Object.fromEntries(events.map((event) => [event.key, event.kind === "ducks" ? "done" : "met"])) as RunState["events"];
    const line = resultComment({ ...run, events: allDucks });
    expect(line).toMatch(/都平安過鐵軌了$/);
    expect(ducks.length).toBeGreaterThan(0);
    const none = Object.fromEntries(events.map((event) => [event.key, "met"])) as RunState["events"];
    expect(resultComment({ ...run, events: none })).toBe("朋友都平安到家了");
    // 小站長沒有事件，照舊。
    expect(resultComment(createRun("captain"))).toBe("朋友都平安到家了");
  });
});

describe("沿途事件：前窗提示與朗讀", () => {
  it("提示出現時前窗上緣說要做什麼，朗讀一次（key 是站:段:事件）", () => {
    const s = atHint("crossing");
    const notice = windowNotice(s, false)!;
    expect(notice.kind).toBe("event");
    expect(notice.text).toBe("平交道，按喇叭");
    const item = nextSpeech(s, false, new Set())!;
    const event = sectionEvent(s)!;
    expect(item.key).toBe(`${event.key}:crossing`);
    expect(nextSpeech(s, false, new Set([item.key]))).toBeNull();
  });

  it("揮手的朋友：提示叫孩子點朋友，不說按喇叭", () => {
    expect(windowNotice(atHint("wave"), false)?.text).toBe("有朋友在揮手，點朋友");
  });

  it("做到了換成回應那句、不念；沒做到到時間就收", () => {
    const s = atHint("wave");
    const event = sectionEvent(s)!;
    const done = { ...s, events: { [event.key]: "done" as const } };
    expect(windowNotice(done, false)?.text).toBe("揮揮手！朋友好開心");
    expect(windowNotice(done, false)?.event?.done).toBe(true);
    expect(nextSpeech(done, false, new Set())).toBeNull();
    const met = { ...s, progress: event.until + 0.01, events: { [event.key]: "met" as const } };
    expect(windowNotice(met, false)).toBeNull();
  });
});

describe("沿途事件：前窗畫法的狀態", () => {
  it("小鴨看車的位置過鐵軌；減少動態只有路邊與對面兩格", () => {
    const at = -1.4;
    const event = at * 600;
    expect(duckCross(false, event - 200, at)).toBe(0);
    expect(duckCross(false, event - 40, at)).toBeGreaterThan(0);
    expect(duckCross(false, event, at)).toBe(1);
    expect(duckCross(true, event - 100, at)).toBe(0);
    expect(duckCross(true, event - 10, at)).toBe(1);
  });

  it("小鴨走完時三隻都離開我們的軌道（鋼軌 ±0.75、小鴨身寬約 ±1.65）", () => {
    for (const x of duckXs(1)) expect(x - 1.65).toBeGreaterThan(0.75);
    for (const x of duckXs(0)) expect(x + 2.6).toBeLessThan(-0.75);
  });

  it("賽跑：推著快、終點前說「快追上了」（還沒做到）；到終點追上了才說「跑贏了」", () => {
    const s = atHint("race");
    const event = sectionEvent(s)!;
    const chasing = windowNotice(s, false);
    expect(chasing?.text).toBe("快追上小狗了");
    expect(chasing?.event?.done).toBe(false);
    expect(windowNotice({ ...s, power: 2 }, false)?.text).toBe("跟小狗賽跑，推到快");
    const done = { ...s, progress: event.at + 0.01, events: { [event.key]: "done" as const } };
    expect(windowNotice(done, false)?.text).toBe("跑贏小狗了");
  });

  it("平交道燈左右輪流、每秒最多換兩次；減少動態常亮", () => {
    expect(crossingLamps(false, 0)).toEqual([true, false]);
    expect(crossingLamps(false, 0.6)).toEqual([false, true]);
    expect(crossingLamps(true, 0.6)).toEqual([true, true]);
  });

  it("賽跑：終點前小動物跑在前面；做到了被超過，沒做到再往前跑", () => {
    const at = -1;
    expect(raceGap(false, at * 600 - 50, at, null)).toBe(RACE_AHEAD);
    expect(raceGap(false, at * 600 + 10, at, "done")!).toBeLessThan(RACE_AHEAD);
    expect(raceGap(false, at * 600 + 10, at, "met")!).toBeGreaterThan(RACE_AHEAD);
    expect(raceGap(true, at * 600 + 10, at, "done")!).toBeLessThan(RACE_AHEAD);
  });

  it("賽跑：終點前開快看得到追近、開慢被拉遠；過終點不跳；減少動態固定距離", () => {
    const at = -1;
    const before = at * 600 - 50;
    const fast = raceGap(false, before, at, null, 0.82)!;
    const slow = raceGap(false, before, at, null, 0.45)!;
    expect(fast).toBeLessThan(RACE_AHEAD);
    expect(slow).toBeGreaterThan(RACE_AHEAD);
    expect(raceGap(false, at * 600 + 0.01, at, "done", 0.82)!).toBeCloseTo(raceGap(false, at * 600, at, null, 0.82)!, 1);
    expect(raceGap(true, before, at, null, 0.82)).toBe(RACE_AHEAD);
    expect(raceGap(true, before, at, null, 0.2)).toBe(RACE_AHEAD);
  });

  it("平交道的噹噹在音量限制內，跟自動輕煞的叮叮不同音", () => {
    expect(chimeWithinLimits(CROSSING_BELL)).toBe(true);
    expect(CROSSING_BELL[0]!.freq).not.toBe(AUTO_BRAKE_DING[0]!.freq);
  });
});

describe("沿途事件：回饋與朗讀的時效", () => {
  it("四種事件做到時都回饋一次：按下去當下寫入的平交道（喇叭）、揮手（點朋友）也算；小鴨同時加提前慢下來只算事件", () => {
    for (const [kind, type] of [["crossing", "honk"], ["wave", "wave"]] as const) {
      const s = atHint(kind);
      const pressed = step(s, { type });
      expect(cheerFor(s, pressed)).toBe("event");
      // 同一件不會再回饋一次。
      expect(cheerFor(pressed, step(pressed, { type }))).toBeNull();
    }
    // 小鴨在速度表真的掉下來那一幀回饋、賽跑在終點追上那一幀回饋（PR-I1），不是撥桿那一刻。
    const ducks = step(atHint("ducks"), { type: "set-power", notch: 0 });
    const cheers = (from: RunState, until: (s: RunState) => boolean) => {
      let prev = from;
      const out: string[] = [];
      for (let i = 0; i < 2000 && !until(prev); i += 1) {
        const next = step(prev, { type: "tick", dt: 1 / 30 });
        const cheer = cheerFor(prev, next);
        if (cheer) out.push(cheer);
        prev = next;
      }
      return { out, last: prev };
    };
    const slowed = cheers(ducks, (s) => Object.keys(s.events).length > 0);
    expect(slowed.out).toEqual(["event"]);
    expect(slowed.last.earlySlows).toBe(ducks.earlySlows + 1);
    const race = atHint("race");
    const raceEvent = sectionEvent(race)!;
    const raced = cheers(race, (s) => s.progress > raceEvent.until);
    expect(raced.out).toEqual(["event"]);
  });

  it("提前慢下來（小站長）是 early-slow；開新一趟、跳段讓數字變少都不回饋", () => {
    const run = createRun("captain");
    expect(cheerFor(run, { ...run, earlySlows: 1 })).toBe("early-slow");
    const s = atHint("wave");
    const event = sectionEvent(s)!;
    const done = { ...s, events: { [event.key]: "done" as const }, earlySlows: 2 };
    expect(cheerFor(done, createRun("drive", "big"))).toBeNull();
    expect(cheerFor(done, done)).toBeNull();
  });

  it("eventSpeech 只回還能做、還沒念過的事件提示", () => {
    const s = atHint("crossing");
    const item = eventSpeech(s, false, new Set())!;
    expect(item.text).toBe("平交道，按喇叭");
    expect(eventSpeech(s, false, new Set([item.key]))).toBeNull();
    const event = sectionEvent(s)!;
    expect(eventSpeech({ ...s, progress: event.until + 0.01 }, false, new Set())).toBeNull();
    expect(eventSpeech({ ...s, events: { [event.key]: "done" } }, false, new Set())).toBeNull();
    // 站段的提示（隧道、對向列車）不算。
    expect(eventSpeech(withHook(createRun("drive", "big"), { stationIndex: 1, progress: 0.03, passing: 1 }), false, new Set())).toBeNull();
  });
});

