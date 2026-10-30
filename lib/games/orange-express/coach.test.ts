import { describe, expect, it } from "vitest";
import { coachBeat } from "@/lib/games/orange-express/coach";
import { createRun, currentStation, withHook } from "@/lib/games/orange-express/reducer";

describe("進站示範的兩拍", () => {
  const base = createRun("drive", "little");
  const station = currentStation(base);

  it("進站點之前不示範", () => {
    expect(coachBeat(withHook(base, { progress: station.approachAt - 0.01, speed: 0.4 }))).toBe("none");
  });

  it("剛進站、現在拉「停」會停在區間前面：只亮停車目標條", () => {
    const early = withHook(base, { progress: station.approachAt + 0.005, speed: 0.45 });
    expect(coachBeat(early)).toBe("watch");
  });

  it("現在拉「停」剛好停進區間（或已經來不及）：強調煞車", () => {
    // 往前推到「拉停會停在區間起點以後」的那一刻。
    let progress = station.approachAt;
    let beat = coachBeat(withHook(base, { progress, speed: 0.45 }));
    while (beat !== "brake" && progress < station.window.end) {
      progress += 0.005;
      beat = coachBeat(withHook(base, { progress, speed: 0.45 }));
    }
    expect(beat).toBe("brake");
    expect(progress).toBeLessThan(station.window.start);
  });

  it("車停在區間前（停太早）回到只亮目標條；停好、倒車、開門都不示範", () => {
    expect(coachBeat(withHook(base, { progress: station.approachAt + 0.02, speed: 0 }))).toBe("watch");
    expect(coachBeat(withHook(base, { progress: station.target, speed: 0 }))).toBe("none");
    expect(coachBeat({ ...withHook(base, { progress: 0.7, speed: 0.2 }), phase: "reversing" })).toBe("none");
    expect(coachBeat({ ...withHook(base, { progress: station.target, speed: 0 }), phase: "doors-open" })).toBe("none");
  });
});
