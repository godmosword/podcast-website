import { describe, expect, it } from "vitest";
import { windowNotice } from "@/lib/games/orange-express/notice";
import { createRun, currentStation, withHook } from "@/lib/games/orange-express/reducer";

describe("前窗提示", () => {
  it("快到速限牌時提醒，牌子畫幾條、文字說快慢；家長開數字時說速限多少", () => {
    const base = createRun("drive", "big");
    const sign = currentStation(base).signs[0]!;
    const near = withHook(base, { progress: sign.at - 0.03, speed: 0.4 });
    expect(windowNotice(near, false)).toEqual({ kind: "sign", text: "速限牌：開中速", bars: 2 });
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
