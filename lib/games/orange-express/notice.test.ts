import { describe, expect, it } from "vitest";
import { speechMs } from "@/lib/games/orange-express/announce";
import { nextSpeech, noticeWithDoorHint, speechCandidates, windowNotice } from "@/lib/games/orange-express/notice";
import { createRun, currentStation, withHook } from "@/lib/games/orange-express/reducer";

describe("門還沒亮就按", () => {
  it("剛出發按了：前窗右上馬上說「門亮了再按」，蓋過速限牌", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[0]!;
    const near = withHook(base, { progress: sign.at - 0.03, speed: 0.4 });
    expect(noticeWithDoorHint(near, false, true)).toEqual({ kind: "door", text: "門亮了再按" });
    expect(noticeWithDoorHint(near, false, false)?.kind).toBe("sign");
  });

  it("進站區間有停車目標條：交給目標條說，前窗右上不再多一塊", () => {
    const base = createRun("drive", "little");
    const approach = withHook(base, { progress: currentStation(base).approachAt + 0.02, speed: 0.3 });
    expect(noticeWithDoorHint(approach, false, true)).toBeNull();
  });
});

describe("前窗提示", () => {
  it("快到速限牌時提醒，牌子畫幾條、文字說快慢；家長開數字時說速限多少", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[0]!;
    const near = withHook(base, { progress: sign.at - 0.03, speed: 0.4 });
    expect(windowNotice(near, false)).toEqual({ kind: "sign", text: "速限牌：開中速", bars: 2, at: sign.at });
    expect(windowNotice(near, true)?.text).toBe("速限牌 165");
  });

  it("鐵橋上請按喇叭；按過換成打招呼了", () => {
    const bridge = withHook(createRun("drive", "big"), { stationIndex: 1, progress: 0.15, speed: 0.4 });
    expect(windowNotice(bridge, false)?.kind).toBe("bridge");
    expect(windowNotice({ ...bridge, bridgeGreeted: true }, false)?.kind).toBe("greeted");
  });

  it("隧道與對向列車；停好時不說話", () => {
    const base = createRun("drive", "little");
    const tunnel = currentStation(base).tunnel!;
    expect(windowNotice(withHook(base, { progress: tunnel.from + 0.01, speed: 0.4 }), false)?.kind).toBe("tunnel");
    const passing = withHook(base, { stationIndex: 1, progress: 0.03, speed: 0.4, passing: 1 });
    expect(windowNotice(passing, false)?.kind).toBe("passing");
    expect(windowNotice(withHook(base, { progress: 0.65, speed: 0 }), false)).toBeNull();
  });

  it("對向列車比速限牌優先；進站區間交給停車目標條", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[0]!;
    const both = withHook(base, { progress: sign.at - 0.01, speed: 0.4, passing: 1 });
    expect(windowNotice(both, false)?.kind).toBe("passing");
    const approach = currentStation(base).approachAt;
    expect(windowNotice(withHook(base, { progress: approach + 0.01, speed: 0.4 }), false)).toBeNull();
  });
});

describe("前窗提示的朗讀", () => {
  it("指差確認排第一；速限牌提示和「速限牌，確認！」只念要喊的那句", () => {
    const base = createRun("drive", "big");
    const signTask = currentStation(base).points.find((task) => task.kind === "sign")!;
    const state = withHook(base, { progress: signTask.at + 0.001, speed: 0.4 });
    const items = speechCandidates(state, false);
    expect(items[0]?.text).toBe("速限牌，確認！");
    expect(items.some((item) => item.text.startsWith("速限牌："))).toBe(false);
  });

  it("同一件事一站只念一次：A→B→A 不重念，換站才再念", () => {
    const base = createRun("drive", "little");
    const tunnel = currentStation(base).tunnel!;
    const inside = withHook(base, { progress: tunnel.from + 0.01, speed: 0.4 });
    const spoken = new Set<string>();
    const first = nextSpeech(inside, false, spoken)!;
    expect(first.text).toBe("進隧道了，車內燈亮了");
    spoken.add(first.key);
    expect(nextSpeech({ ...inside, passing: 1 }, false, spoken)?.text).toBe("對向列車來了，揮揮手");
    expect(nextSpeech(inside, false, spoken)).toBeNull();
    expect(first.key.startsWith("0:")).toBe(true);
  });

  it("速度表數字開關改了字，也不會再念一次", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[1]!;
    const near = withHook(base, { progress: sign.at - 0.03, speed: 0.4 });
    const words = nextSpeech(near, false, new Set())!;
    const numbers = nextSpeech(near, true, new Set([words.key]));
    expect(numbers).toBeNull();
  });

  it("打招呼了不念；提示消失了就沒得念", () => {
    const bridge = withHook(createRun("drive", "little"), { stationIndex: 1, progress: 0.15, speed: 0.4 });
    expect(nextSpeech({ ...bridge, bridgeGreeted: true }, false, new Set())).toBeNull();
    expect(nextSpeech(withHook(bridge, { progress: 0.65, speed: 0 }), false, new Set())).toBeNull();
  });

  it("念完一句大約多久：字越多越久", () => {
    expect(speechMs("下一站，遊樂園站")).toBeGreaterThan(speechMs("叮"));
  });
});

describe("前窗提示的朗讀：同一面速限牌不念兩次", () => {
  it("號誌題念完、速限牌題還沒出：速限牌提示先不念，等題目出來只念「速限牌，確認！」", () => {
    const base = createRun("drive", "big");
    const early = withHook(base, { progress: 0.02, speed: 0.1 });
    const spoken = new Set(["0:point:orange-park-signal"]);
    expect(windowNotice(early, false)?.kind).toBe("sign");
    expect(nextSpeech(early, false, spoken)).toBeNull();
    const signTask = currentStation(base).points.find((task) => task.kind === "sign")!;
    const later = withHook(base, { progress: signTask.at + 0.005, speed: 0.1 });
    expect(nextSpeech(later, false, spoken)?.text).toBe("速限牌，確認！");
  });

  it("沒有指差確認的司機，速限牌提示照念", () => {
    const base = createRun("drive", "little");
    expect(currentStation(base).signs).toHaveLength(0);
    const big = createRun("captain");
    const second = currentStation(big).signs[1]!;
    const near = withHook(big, { progress: second.at - 0.03, speed: 0.4 });
    expect(nextSpeech(near, false, new Set())?.text).toMatch(/^速限牌：/);
  });
});
