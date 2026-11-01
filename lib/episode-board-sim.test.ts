import { describe, expect, it } from "vitest";
import { loadEpisodeBoard } from "@/lib/episode-board";
import {
  actorPropClearance,
  actorScreenGap,
  boardClockPaused,
  canvasPixelSize,
  createBoardSim,
  deltaSeconds,
  lightPhase,
  minActorScreenGap,
  poseFor,
  sortDrawOrder,
  stepBoard,
  type BoardSimState,
  type BoardView,
} from "@/lib/episode-board-sim";

const PHONE: BoardView = { width: 390, height: 520 };
const NARROW: BoardView = { width: 320, height: 420 };
const DESKTOP: BoardView = { width: 1280, height: 720 };

describe("episode board simulation", () => {
  it("用 rAF timestamp 計時，暫停時不累積、單格有上限", () => {
    expect(deltaSeconds(1000, null, false)).toEqual({ dt: 0, last: 1000 });
    expect(deltaSeconds(1040, 1000, false).dt).toBeCloseTo(0.04);
    expect(deltaSeconds(5000, 1000, false).dt).toBe(0.05);
    expect(deltaSeconds(9000, 1000, true)).toEqual({ dt: 0, last: 9000 });
    expect(boardClockPaused({ reduced: true, visible: true, pageVisible: true })).toBe(true);
    expect(boardClockPaused({ reduced: false, visible: false, pageVisible: true })).toBe(true);
    expect(boardClockPaused({ reduced: false, visible: true, pageVisible: false })).toBe(true);
    expect(boardClockPaused({ reduced: false, visible: true, pageVisible: true })).toBe(false);
  });

  it("畫布像素跟 DPR 走，最高 2", () => {
    expect(canvasPixelSize(390, 520, 2)).toEqual({ ratio: 2, width: 780, height: 1040 });
    expect(canvasPixelSize(390, 520, 3).ratio).toBe(2);
    expect(canvasPixelSize(390, 520, 0).ratio).toBe(1);
    expect(canvasPixelSize(10.4, 10.4, 1.5)).toEqual({ ratio: 1.5, width: 16, height: 16 });
  });

  it("紅車會變成機器人，灰灰最後回到自己的顏色，燈號不只靠顏色", () => {
    expect(poseFor("transform-robot", 0, false).robot).toBe(0);
    expect(poseFor("transform-robot", 2.4, false).robot).toBe(1);
    expect(poseFor("transform-robot", 3.3, false).robot).toBeGreaterThan(0);
    expect(poseFor("transform-robot", 3.3, false).robot).toBeLessThan(1);
    expect(poseFor("paint-self", 3.6, false).paint).toBe(3);
    expect(poseFor("paint-self", 0.2, false).paint).toBe(0);
    expect(lightPhase(0)).toBe("stop");
    expect(lightPhase(1.6)).toBe("count");
    expect(lightPhase(2.6)).toBe("go");
  });

  it("靜止時車身就分開，也不壓在房子和水池上", () => {
    for (const view of [PHONE, NARROW, DESKTOP]) {
      const state = createBoardSim(loadEpisodeBoard().actors);
      expect(actorScreenGap(state, view)).toBeGreaterThanOrEqual(minActorScreenGap(view) - 0.5);
      expect(actorPropClearance(state)).toBeGreaterThanOrEqual(-0.05);
    }
  });

  it("開一段時間後仍不互相穿過，等角排序由遠到近", () => {
    for (const view of [PHONE, NARROW, DESKTOP]) {
      let state = createBoardSim(loadEpisodeBoard().actors);
      for (let frame = 0; frame < 8 * 30; frame += 1) {
        state = stepBoard(state, 1 / 30, view);
        expect(actorPropClearance(state), view.width.toString()).toBeGreaterThanOrEqual(-0.2);
        expect(actorScreenGap(state, view), view.width.toString()).toBeGreaterThanOrEqual(
          minActorScreenGap(view) - 1,
        );
      }
      const depths = sortDrawOrder(state).map((entity) => entity.depth);
      expect(depths).toEqual([...depths].sort((a, b) => a - b));
    }
  });

  it("疊在一起的車會被推開，紅燈時小紅留在燈前面", () => {
    const piled = createBoardSim([
      { id: "a", character: "duo-duo", action: "drive" },
      { id: "b", character: "xiao-hong", action: "drive" },
    ]);
    const overlapped: BoardSimState = {
      age: 0,
      actors: piled.actors.map((actor) => ({ ...actor, x: 40, y: 36 })),
    };
    const separated = stepBoard(overlapped, 0.4, PHONE);
    expect(actorScreenGap(separated, PHONE)).toBeGreaterThanOrEqual(minActorScreenGap(PHONE) - 1);
    expect(actorPropClearance(separated)).toBeGreaterThanOrEqual(-0.2);

    const waiting = createBoardSim([
      { id: "red", character: "xiao-hong", action: "wait-light" },
    ]);
    const before = waiting.actors[0]!;
    const held = stepBoard(waiting, 0.3, PHONE);
    const after = held.actors[0]!;
    expect(after.waiting).toBe(true);
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(1.5);
  });

  it("時間用累積的 timestamp，不會因為單格很大就穿過去", () => {
    const start = createBoardSim(loadEpisodeBoard().actors);
    const jumped = stepBoard(start, 1, PHONE);
    expect(actorPropClearance(jumped)).toBeGreaterThanOrEqual(-0.2);
    expect(actorScreenGap(jumped, PHONE)).toBeGreaterThanOrEqual(minActorScreenGap(PHONE) - 1);
    expect(jumped.age).toBeCloseTo(0.05);
  });

  it("空名單不會壞，整隊車每幀模擬夠快", () => {
    const state = createBoardSim([]);
    expect(stepBoard(state, 0.2, PHONE)).toBe(state);
    const cast = loadEpisodeBoard().actors;
    expect(cast.length).toBeGreaterThan(4);
    let moving = createBoardSim(cast);
    const started = performance.now();
    const frames = 180;
    for (let frame = 0; frame < frames; frame += 1) {
      moving = stepBoard(moving, 1 / 30, PHONE);
    }
    const avgMs = (performance.now() - started) / frames;
    expect(avgMs).toBeLessThan(4);
    expect(actorPropClearance(moving)).toBeGreaterThanOrEqual(-0.2);
  });
});
