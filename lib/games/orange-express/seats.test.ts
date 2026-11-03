import { describe, expect, it } from "vitest";
import { createRun, step, withHook } from "@/lib/games/orange-express/reducer";
import { SEAT_COLOR, seatsFor, seatsLabel } from "@/lib/games/orange-express/seats";
import type { RunState } from "@/lib/games/orange-express/types";

function at(state: RunState, patch: Partial<RunState>): RunState {
  return { ...state, ...patch };
}

function aboardIds(state: RunState): string[] {
  return seatsFor(state).groups.flatMap((group) => group.seats.filter((seat) => seat.aboard).map((seat) => seat.id));
}

describe("接朋友座位（PR-J2）", () => {
  it("四組都有：慢慢看 2 位、小小司機與大司機各 3 位、小站長 5 位；開局都是空位，第一站是下一站", () => {
    const counts = [createRun("look"), createRun("drive", "little"), createRun("drive", "big"), createRun("captain")].map(
      (run) => seatsFor(run).total,
    );
    expect(counts).toEqual([2, 3, 3, 5]);
    const seats = seatsFor(createRun("drive", "big"));
    expect(seats.aboard).toBe(0);
    expect(seats.groups.map((group) => group.next)).toEqual([true, false, false]);
    expect(seats.groups.map((group) => group.seats.map((seat) => seat.id))).toEqual([["bonbon"], ["xiaonan"], ["mami"]]);
  });

  it("開門時一位一位亮（跟月台上車同一拍）；關門出站後那站全亮、下一站換人；到家全亮、沒有下一站", () => {
    let s = at(createRun("captain"), { phase: "doors-open", boarded: 1, progress: 0.65 });
    expect(aboardIds(s)).toEqual(["bonbon"]);
    s = at(s, { boarded: 2 });
    s = step(s, { type: "close-doors" });
    expect(aboardIds(s)).toEqual(["bonbon", "dot"]);
    expect(seatsFor(s).groups.map((group) => group.next)).toEqual([false, true, false]);
    const done = at(createRun("captain"), { stationIndex: 2, phase: "route-done" });
    expect(seatsFor(done).aboard).toBe(5);
    expect(seatsFor(done).groups.some((group) => group.next)).toBe(false);
  });

  it("每位朋友只上車一次（小站長回家站原本又接一次 Bonbon、馬米）", () => {
    for (const run of [createRun("captain"), createRun("drive", "big"), createRun("drive", "little"), createRun("look")]) {
      const ids = seatsFor(run).groups.flatMap((group) => group.seats.map((seat) => seat.id));
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) expect(SEAT_COLOR[id]).toMatch(/^rgb\(/);
    }
    const home = at(createRun("captain"), { stationIndex: 2, phase: "running" });
    expect(aboardIds(home)).toEqual(["bonbon", "dot", "xiaonan", "sprout"]);
  });

  it("讀屏一句：已上車幾位、共幾位、下一站（停著時說到站了）", () => {
    const run = createRun("drive", "big");
    expect(seatsLabel(seatsFor(run), false)).toBe("要接的朋友：已上車 0 位，共 3 位，下一站遊樂園");
    const stopped = withHook(run, { stationIndex: 1, progress: 0.65, speed: 0 });
    expect(seatsLabel(seatsFor(stopped), true)).toBe("要接的朋友：已上車 1 位，共 3 位，到站了橘子坡");
    expect(seatsLabel(seatsFor(at(run, { phase: "route-done", stationIndex: 2 })), false)).toBe(
      "要接的朋友：已上車 3 位，共 3 位",
    );
  });
});
