import { describe, expect, it } from "vitest";
import { createBoard } from "./board-gen";
import { listLegalMoves } from "./engine";
import { seededRng } from "./rng";
import { simulateMany, simulateRound } from "./simulate";
import { CANDY_STAGES, buildRound } from "./stages";
import { findGoalHint } from "./strategy";
import { freshCandyProgress } from "./tasks";

// 完整 200 seed 報表見 scripts/candy-match-sim.ts；這裡只放快速回歸樣本。
const SEEDS = 24;

describe("Candy 模擬回歸", () => {
  it("同一 seed 結果可重現", () => {
    const round = buildRound(3, "challenge", { replay: false, rng: Math.random });
    expect(simulateRound(round, "greedy", 7)).toEqual(simulateRound(round, "greedy", 7));
  });

  it("輕鬆主線：目標導向全部通關，且很少三步內就結束", () => {
    for (let li = 0; li < 10; li++) {
      const round = buildRound(li, "easy", { replay: false, rng: Math.random });
      const greedy = simulateMany(round, "greedy", SEEDS);
      expect(greedy.winRate, round.stage.id).toBe(1);
      expect(greedy.quickWinRate, round.stage.id).toBeLessThanOrEqual(li === 0 || li === 4 ? 0.5 : 0.1);
    }
  });

  it("挑戰後期：目標導向明顯優於隨機交換，且不是必勝", () => {
    for (const li of [6, 7, 8, 9]) {
      const round = buildRound(li, "challenge", { replay: false, rng: Math.random });
      const greedy = simulateMany(round, "greedy", SEEDS);
      const random = simulateMany(round, "random", SEEDS);
      expect(greedy.winRate, round.stage.id).toBeGreaterThan(random.winRate + 0.2);
      expect(greedy.winRate, round.stage.id).toBeLessThan(0.95);
    }
  });

  it("目標導向提示永遠是合法步", () => {
    const stage = CANDY_STAGES.easy[7]!.main;
    for (let seed = 1; seed <= 20; seed++) {
      const board = createBoard(6, 8, stage.pieceKinds, seededRng(seed), { dropCount: stage.dropCount });
      const hint = findGoalHint(board, stage.goals, freshCandyProgress());
      expect(hint).not.toBeNull();
      expect(listLegalMoves(board)).toContainEqual(hint);
    }
  });
});
