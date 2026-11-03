import { describe, expect, it } from "vitest";
import { createRun, step, withHook } from "@/lib/games/orange-express/reducer";
import { routeStripFor } from "@/lib/games/orange-express/route-strip";
import type { RunState } from "@/lib/games/orange-express/types";

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

describe("路線條", () => {
  it("大司機、小站長有（小站長 PR-I4 起）；開局小橘在最左邊，每一站的朋友都站在章上", () => {
    expect(routeStripFor(createRun("drive", "little"))).toBeNull();
    expect(routeStripFor(createRun("look"))).toBeNull();
    expect(routeStripFor(createRun("captain"))!.stops.map((stop) => stop.waiting.length)).toEqual([2, 2, 2]);
    const strip = routeStripFor(createRun("drive", "big"))!;
    expect(strip.train).toBe(0);
    expect(strip.stops.map((stop) => stop.name)).toEqual(["遊樂園", "橘子坡", "回家"]);
    expect(strip.stops.map((stop) => stop.waiting.map((rider) => rider.id))).toEqual([
      ["bonbon"],
      ["xiaonan"],
      ["mami"],
    ]);
    expect(strip.stops[2]!.at).toBe(100);
    expect(strip.riding).toEqual([]);
    expect(strip.next).toBe("遊樂園");
    expect(strip.stops.map((stop) => stop.next)).toEqual([true, false, false]);
    expect(strip.stops.some((stop) => stop.reached)).toBe(false);
  });

  it("進站後讓給停車目標條；到終點不出", () => {
    const run = createRun("drive", "big");
    expect(routeStripFor(withHook(run, { progress: 0.2 }))).not.toBeNull();
    expect(routeStripFor(withHook(run, { progress: 0.4 }))).toBeNull();
    expect(routeStripFor(at(run, { phase: "route-done" }))).toBeNull();
  });

  it("朋友上車後跟著小橘走，那一站的章記成停過", () => {
    let s = at(createRun("drive", "big"), { phase: "doors-open", boarded: 1, grades: ["green"], progress: 0.65 });
    s = step(s, { type: "close-doors" });
    const strip = routeStripFor(s)!;
    expect(strip.stops[0]!.waiting).toEqual([]);
    expect(strip.stops[0]!.reached).toBe(true);
    expect(strip.stops[1]!.reached).toBe(false);
    expect(strip.riding.map((rider) => rider.id)).toEqual(["bonbon"]);
    expect(strip.train).toBe(strip.stops[0]!.at);
    expect(strip.next).toBe("橘子坡");
    expect(strip.stops.map((stop) => stop.next)).toEqual([false, true, false]);
  });

  it("小橘一路往右，不會跑過下一站的章", () => {
    let s = step(createRun("drive", "big"), { type: "set-power", notch: 4 });
    let last = -1;
    for (let i = 0; i < 2000; i += 1) {
      s = step(s, { type: "tick", dt: 1 / 30 });
      const strip = routeStripFor(s);
      if (!strip) break;
      expect(strip.train).toBeGreaterThanOrEqual(last);
      expect(strip.train).toBeLessThanOrEqual(strip.stops[0]!.at);
      last = strip.train;
    }
    expect(last).toBeGreaterThan(10);
  });
});
