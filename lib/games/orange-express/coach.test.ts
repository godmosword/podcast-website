import { describe, expect, it } from "vitest";
import { coachBeat } from "@/lib/games/orange-express/coach";
import { createRun, currentStation, step, withHook } from "@/lib/games/orange-express/reducer";
import type { RunState, StopGrade } from "@/lib/games/orange-express/types";

function tick(state: RunState, dt: number): RunState {
  return step(state, { type: "tick", dt });
}

/** 推著快開進站（大司機、小站長會自動輕煞到進站速度旗），開到示範說「現在拉停」那一刻。 */
function untilBrakeBeat(start: RunState, dt: number): RunState {
  let s = start;
  for (let i = 0; i < 4000 && coachBeat(s) !== "brake"; i += 1) s = tick(s, dt);
  expect(coachBeat(s)).toBe("brake");
  return s;
}

/** 聽到「現在拉停」後等 delay 秒才拉，停在哪一區。 */
function gradeAfter(cue: RunState, delay: number, dt: number): StopGrade | undefined {
  let s = cue;
  for (let t = 0; t < delay - 1e-9; t += dt) s = tick(s, dt);
  s = step(step(s, { type: "set-power", notch: 0 }), { type: "set-brake", notch: 3 });
  for (let i = 0; i < 4000 && s.phase !== "stopped" && s.phase !== "reversing"; i += 1) s = tick(s, dt);
  return s.grades[s.stationIndex];
}

describe("進站示範的兩拍", () => {
  const base = createRun("drive", "little");
  const station = currentStation(base);

  it("進站點之前不示範", () => {
    expect(coachBeat(withHook(base, { progress: station.approachAt - 0.01, speed: 0.4 }))).toBe("none");
  });

  it("剛進站：先只亮停車目標條（準備拉停），還不叫孩子拉", () => {
    const early = withHook(base, { progress: station.approachAt + 0.005, speed: 0.45 });
    expect(coachBeat(early)).toBe("watch");
  });

  it("「現在拉停」不在剛好停進黃區時叫：那一刻現在就拉也停在綠區", () => {
    const cue = untilBrakeBeat(withHook(base, { progress: station.approachAt, speed: 0.45, power: 2 }), 1 / 60);
    expect(cue.progress).toBeGreaterThan(station.window.start);
    expect(gradeAfter(cue, 0, 1 / 60)).toBe("green");
  });

  it("車停在區間前（停太早）回到只亮目標條；停好、倒車、開門都不示範", () => {
    expect(coachBeat(withHook(base, { progress: station.approachAt + 0.02, speed: 0 }))).toBe("watch");
    expect(coachBeat(withHook(base, { progress: station.target, speed: 0 }))).toBe("none");
    expect(coachBeat({ ...withHook(base, { progress: 0.7, speed: 0.2 }), phase: "reversing" })).toBe("none");
    expect(coachBeat({ ...withHook(base, { progress: station.target, speed: 0 }), phase: "doors-open" })).toBe("none");
  });
});

describe("照「現在拉停」做就停進綠區（PR-I1，astra 2026-11-03 重現：原本照做停在黃區）", () => {
  const cases = [
    { name: "大司機", level: "drive", driver: "big", delays: [0, 0.6, 1.2] },
    { name: "小小司機", level: "drive", driver: "little", delays: [0, 0.6, 1.2] },
    // 小站長綠區窄一半：聽到後約 0.3–0.9 秒拉都在綠區。
    { name: "小站長", level: "captain", driver: "big", delays: [0.3, 0.6, 0.9] },
  ] as const;

  for (const c of cases) {
    for (const dt of [1 / 30, 1 / 60]) {
      it(`${c.name}第一站推著快開進站，聽到後 ${c.delays.join("／")} 秒拉停都停在綠區（${Math.round(1 / dt)}fps）`, () => {
        const run = createRun(c.level, c.driver);
        const start = withHook(run, { progress: currentStation(run).approachAt - 0.1, speed: 0.8, power: 4 });
        const cue = untilBrakeBeat(start, dt);
        for (const delay of c.delays) expect(gradeAfter(cue, delay, dt), `${delay} 秒`).toBe("green");
      });
    }
  }
});
