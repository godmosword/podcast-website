import { describe, expect, it } from "vitest";
import { buildStageStart, isValidStageStart, stoneTemplateIssues } from "./board-gen";
import { freshGame } from "./engine";
import { allBlockGoalsDone, blockGoalRemainingLabel, blockGoalStatus, blockGoalsSummary, stoneRowCount } from "./goals";
import { pieceSequence } from "./placement";
import { solveStage } from "./solver";
import {
  BLOCK_STAGES,
  BLOCK_STATIONS,
  blockStars,
  buildBlockRound,
  dangerRowFor,
  mirrorStones,
  shiftStones,
  stageBoard,
  stageEngineConfig,
} from "./stages";
import { simulateBlockMany, BLOCK_POLICIES } from "./simulate";

const allStages = () =>
  (["easy", "challenge"] as const).flatMap((mode) =>
    BLOCK_STAGES[mode].flatMap((set) => [set.main, ...set.variants].map((stage) => ({ mode, stage }))),
  );

describe("十站配置", () => {
  it("10 站都用 8 欄、最大 8×16；id 唯一；每站至少一個重玩變體", () => {
    expect(BLOCK_STATIONS).toHaveLength(10);
    const ids = new Set<string>();
    for (const mode of ["easy", "challenge"] as const) {
      expect(BLOCK_STAGES[mode]).toHaveLength(10);
      for (const set of BLOCK_STAGES[mode]) {
        expect(set.variants.length).toBeGreaterThanOrEqual(1);
        for (const stage of [set.main, ...set.variants]) {
          expect(stage.cols).toBe(8);
          expect(stage.rows).toBeLessThanOrEqual(16);
          expect(ids.has(stage.id)).toBe(false);
          ids.add(stage.id);
        }
      }
    }
  });

  it("每站只加一個新概念：方塊種類與暫存逐站增加，第 5 站才有暫存", () => {
    const main = BLOCK_STAGES.easy.map((s) => s.main);
    main.slice(1).forEach((stage, i) => {
      expect(stage.pieces.length).toBeGreaterThanOrEqual(main[i]!.pieces.length);
    });
    main.forEach((stage, i) => expect(stage.hold).toBe(i >= 4));
  });

  it("輕鬆不限塊數、第 1–2 站不自動落下；挑戰有塊數上限且速度逐站變快", () => {
    BLOCK_STAGES.easy.forEach((set, i) => {
      expect(set.main.pieceCap).toBe(0);
      expect(set.main.autoFall).toBe(i >= 2);
    });
    const falls = BLOCK_STAGES.challenge.map((s) => s.main.fallSeconds);
    falls.slice(1).forEach((f, i) => expect(f).toBeLessThanOrEqual(falls[i]!));
    BLOCK_STAGES.challenge.forEach((set) => {
      expect(set.main.pieceCap).toBeGreaterThan(0);
      expect(set.main.efficiency).toBeLessThan(set.main.pieceCap);
    });
  });
});

describe("石頭模板與開局盤（可解第 1 點）", () => {
  it("所有配置的模板沒有懸空、每排有缺口、不碰危險線；開局盤合法", () => {
    for (const { stage } of allStages()) {
      expect(stoneTemplateIssues(stage), stage.id).toEqual([]);
      const board = buildStageStart(stage);
      expect(isValidStageStart(board, stage)).toBe(true);
      expect(stoneRowCount(board)).toBe(stage.stones.length);
    }
  });

  it("懸空模板會被擋下；鏡像與平移保持形狀", () => {
    expect(stoneTemplateIssues({ cols: 8, rows: 14, stones: ["XXX..XXX", "XXXXXXXX"] }).length).toBeGreaterThan(0);
    expect(mirrorStones(["X..XXXXX"])).toEqual(["XXXXX..X"]);
    expect(shiftStones(["X..XXXXX"])).toEqual(["XX..XXXX"]);
    expect(shiftStones(["XXXXXXX."])).toBeNull();
    expect(stageBoard({ cols: 8, rows: 14, stones: ["X..XXXXX"] })[13]).toEqual(["X", null, null, "X", "X", "X", "X", "X"]);
  });
});

describe("解題器（可解第 2 點）", () => {
  it("挑戰主線與變體在塊數上限內 ≥98% seed 有解（完整 200 seed 見 sim 腳本）", () => {
    for (const set of BLOCK_STAGES.challenge) {
      for (const stage of [set.main, ...set.variants]) {
        let solved = 0;
        const N = 30;
        for (let seed = 1; seed <= N; seed++) if (solveStage(stage, seed, { beam: 32 }).solved) solved++;
        expect(solved / N, stage.id).toBeGreaterThanOrEqual(0.96);
      }
    }
  }, 120_000);

  it("出塊順序與引擎 7-bag 相同，且只出本站方塊", () => {
    const stage = BLOCK_STAGES.easy[0]!.main;
    const seq = pieceSequence({ pieceSet: stage.pieces }, 7, 12);
    expect(seq.every((p) => stage.pieces.includes(p))).toBe(true);
    expect(pieceSequence({ pieceSet: stage.pieces }, 7, 12)).toEqual(seq);
  });
});

describe("目標與星星", () => {
  it("清石頭、消排、一次消兩排的計數與文案", () => {
    const g = freshGame(8, 14, stageBoard({ cols: 8, rows: 14, stones: ["X..XXXXX", "X..X..XX"] }));
    expect(blockGoalStatus({ kind: "clear-stones" }, g, 2)).toMatchObject({ remaining: 2, done: false });
    expect(blockGoalRemainingLabel({ kind: "clear-rows", count: 3 }, { ...g, lines: 1 }, 2)).toBe("還差 2 排");
    expect(blockGoalRemainingLabel({ kind: "clear-stones" }, g, 2)).toBe("還有 2 排石頭");
    expect(allBlockGoalsDone([{ kind: "multi-clear", count: 1 }], { ...g, multiClears: 1 }, 2)).toBe(true);
    expect(blockGoalsSummary([{ kind: "clear-stones" }, { kind: "clear-rows", count: 8 }])).toBe("清完石頭＋消 8 排");
  });

  it("三顆星：完成／沒越線／N 塊內，兩種玩法相同", () => {
    expect(blockStars({ efficiency: 5 }, { crossedLine: false, pieces: 5 }).stars).toBe(3);
    expect(blockStars({ efficiency: 5 }, { crossedLine: true, pieces: 6 }).stars).toBe(1);
  });

  it("重玩抽變體且避開上一次；危險線約頂端 20%", () => {
    const first = buildBlockRound(2, "easy", { replay: false, rng: () => 0.9 });
    expect(first.stage.id).toBe("e3-main");
    const replay = buildBlockRound(2, "easy", { replay: true, previousId: "e3-main", rng: () => 0 });
    expect(replay.stage.id).not.toBe("e3-main");
    expect(dangerRowFor(14)).toBe(3);
    expect(dangerRowFor(16)).toBe(3);
    const config = stageEngineConfig(first);
    expect(config.levelUp).toBe(false);
    expect(config.rescueLimit).toBe(2);
    expect(stageEngineConfig(buildBlockRound(2, "challenge", { replay: false, rng: Math.random })).rescueLimit).toBe(0);
  });
});

describe("玩家策略模擬（可解第 3 點，快速樣本）", () => {
  it("輕鬆主線：孩子式 ≤2 次救援內完成 ≥80%", () => {
    BLOCK_STAGES.easy.forEach((set, i) => {
      const round = { station: BLOCK_STATIONS[i]!, mode: "easy" as const, stage: set.main, replay: false };
      expect(simulateBlockMany(round, BLOCK_POLICIES.kid, 40).withinTwoRescues, set.main.id).toBeGreaterThanOrEqual(0.8);
    });
  }, 60_000);

  it("挑戰：前段技巧型 ≥85%，後段不是必勝", () => {
    const winRate = (i: number) =>
      simulateBlockMany(
        { station: BLOCK_STATIONS[i]!, mode: "challenge", stage: BLOCK_STAGES.challenge[i]!.main, replay: false },
        BLOCK_POLICIES.skilled,
        40,
      ).winRate;
    expect(winRate(0)).toBeGreaterThanOrEqual(0.85);
    expect(winRate(9)).toBeLessThan(0.85);
  }, 60_000);
});
