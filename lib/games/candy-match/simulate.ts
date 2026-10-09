/**
 * 《繽紛消消樂》固定 seed 模擬：比較隨機合法交換與目標導向策略。
 * 只用引擎純函數（與 View 相同的交換、解算與重排），不使用道具。
 * 模擬結果是調校依據，不等於孩子試玩的可玩性證明。
 */

import { createBoard, reshuffle } from "./board-gen";
import {
  findHintMove,
  listLegalMoves,
  resolveBoard,
  swapped,
  swappedSpecials,
  type BoardState,
  type Rng,
} from "./engine";
import { seededRng, pickIndex } from "./rng";
import { findGoalHint, type CandyMove } from "./strategy";
import { allGoalsDone, applyEvents, countSwap, freshCandyProgress, type CandyProgress } from "./tasks";
import type { CandyMatchRound } from "./stages";

export type CandyPolicy = "greedy" | "random";

export type CandySimResult = {
  won: boolean;
  swaps: number;
  movesLeft: number;
  specialsMade: number;
  detonated: number;
  reshuffles: number;
  /** 消除波數（估算動畫時長用） */
  waves: number;
};

/** 輕鬆模式沒有步數上限；模擬以此截斷避免無限局。 */
const SIM_MAX_SWAPS = 150;

function startBoardFor(round: CandyMatchRound, rng: Rng): BoardState {
  return createBoard(round.cols, round.rows, round.stage.pieceKinds, rng, {
    dirtCells: round.stage.dirtCells,
    thickDirtCells: round.stage.thickDirtCells,
    dropCount: round.stage.dropCount,
    requireSpecialMove: round.stage.requireSpecialMove,
  });
}

/** 套用一次玩家交換並解算到穩定（與 View 的規則一致）。 */
function playSwap(
  state: BoardState,
  move: CandyMove,
  kinds: number,
  rng: Rng,
): ReturnType<typeof resolveBoard> {
  const pieces = swapped(state.pieces, move.a, move.b);
  const specials = swappedSpecials(state.specials, move.a, move.b);
  const extra = new Set<number>();
  if (specials[move.a] !== "none") extra.add(move.a);
  if (specials[move.b] !== "none") extra.add(move.b);
  return resolveBoard({ ...state, pieces, specials }, kinds, rng, {
    extraCells: extra.size > 0 ? extra : undefined,
    preferSpawnAt: [move.a, move.b],
  });
}

function chooseMove(
  policy: CandyPolicy,
  state: BoardState,
  round: CandyMatchRound,
  progress: CandyProgress,
  rng: Rng,
): CandyMove | null {
  if (policy === "greedy") return findGoalHint(state, round.stage.goals, progress);
  const legal = listLegalMoves(state);
  return legal.length > 0 ? legal[pickIndex(legal.length, rng)]! : null;
}

export function simulateRound(
  round: CandyMatchRound,
  policy: CandyPolicy,
  seed: number,
  maxSwaps = SIM_MAX_SWAPS,
): CandySimResult {
  const rng = seededRng(seed);
  const kinds = round.stage.pieceKinds;
  const limit = round.stage.moves > 0 ? round.stage.moves : maxSwaps;
  let board = startBoardFor(round, rng);
  let progress = freshCandyProgress(kinds);
  let reshuffles = 0;
  while (!allGoalsDone(round.stage.goals, progress) && progress.swaps < limit) {
    const move = chooseMove(policy, board, round, progress, rng);
    if (!move) {
      board = reshuffle(board, rng, kinds);
      reshuffles += 1;
      continue;
    }
    const result = playSwap(board, move, kinds, rng);
    board = result.state;
    progress = applyEvents(countSwap(progress), result.events);
    if (!findHintMove(board.pieces, board.cols, board.rows, board.specials)) {
      board = reshuffle(board, rng, kinds);
      reshuffles += 1;
    }
  }
  return {
    won: allGoalsDone(round.stage.goals, progress),
    swaps: progress.swaps,
    movesLeft: round.stage.moves > 0 ? round.stage.moves - progress.swaps : 0,
    specialsMade: progress.specialsMade,
    detonated: progress.detonated,
    reshuffles,
    waves: progress.waves,
  };
}

export type CandySimSummary = {
  samples: number;
  winRate: number;
  medianSwaps: number;
  p90Swaps: number;
  /** 三步內就通關的比例（目標太低的警訊） */
  quickWinRate: number;
  avgSpecialsMade: number;
  avgDetonated: number;
  avgReshuffles: number;
  /** 估計時長（秒）：每步思考 4 秒＋每波動畫約 0.55 秒；取勝局中位數 */
  medianSeconds: number;
};

/** 兒童每步思考時間與每波動畫時間的粗估（調校用，不是試玩結果）。 */
const SIM_THINK_SECONDS = 4;
const SIM_WAVE_SECONDS = 0.55;

function estimateSeconds(result: Pick<CandySimResult, "swaps" | "waves">): number {
  return result.swaps * SIM_THINK_SECONDS + result.waves * SIM_WAVE_SECONDS;
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]!;
}

function summarize(results: readonly CandySimResult[]): CandySimSummary {
  const n = results.length || 1;
  const wins = results.filter((r) => r.won);
  const swaps = wins.map((r) => r.swaps).sort((a, b) => a - b);
  return {
    samples: results.length,
    winRate: wins.length / n,
    medianSwaps: percentile(swaps, 0.5),
    p90Swaps: percentile(swaps, 0.9),
    quickWinRate: wins.filter((r) => r.swaps <= 3).length / n,
    avgSpecialsMade: results.reduce((s, r) => s + r.specialsMade, 0) / n,
    avgDetonated: results.reduce((s, r) => s + r.detonated, 0) / n,
    avgReshuffles: results.reduce((s, r) => s + r.reshuffles, 0) / n,
    medianSeconds: percentile(wins.map(estimateSeconds).sort((a, b) => a - b), 0.5),
  };
}

export function simulateMany(
  round: CandyMatchRound,
  policy: CandyPolicy,
  seeds: number,
  firstSeed = 1,
): CandySimSummary {
  const results: CandySimResult[] = [];
  for (let s = 0; s < seeds; s++) results.push(simulateRound(round, policy, firstSeed + s));
  return summarize(results);
}
