/**
 * 《繽紛樂園》任務盤解題器（計劃「可解」第 2 點）：
 * 已知出塊順序，逐塊列舉方向與落點（有暫存的站也試暫存交換），
 * beam search 保留分數最高的盤面，在塊數上限內找出完成路徑。
 */

import { allBlockGoalsDone, stoneRowCount, type BlockGoal } from "./goals";
import { boardFeatures, listPlacements, pieceSequence } from "./placement";
import type { Board, PieceType } from "./pieces";
import { buildStageStart } from "./board-gen";
import { dangerRowFor, type BlockStage } from "./stages";

type SearchState = {
  board: Board;
  hold: PieceType | null;
  idx: number;
  lines: number;
  stoneRowsCleared: number;
  multiClears: number;
  pieces: number;
  score: number;
};

export type SolveResult = { solved: boolean; pieces: number };

function goalScore(goals: readonly BlockGoal[], s: Omit<SearchState, "score">, initialStones: number): number {
  let score = 0;
  for (const goal of goals) {
    if (goal.kind === "clear-rows") score -= Math.max(0, goal.count - s.lines) * 12;
    if (goal.kind === "clear-stones") score -= stoneRowCount(s.board) * 30;
    if (goal.kind === "multi-clear") score -= Math.max(0, goal.count - s.multiClears) * 25;
  }
  void initialStones;
  return score;
}

export function scoreSearchState(
  goals: readonly BlockGoal[],
  s: Omit<SearchState, "score">,
  initialStones: number,
  rows: number,
): number {
  const f = boardFeatures(s.board);
  const danger = f.maxHeight > rows - dangerRowFor(rows) ? 40 : 0;
  return goalScore(goals, s, initialStones) - 0.5 * f.aggregate - 4 * f.holes - 0.35 * f.bumpiness - danger;
}

export function solveStage(
  stage: BlockStage,
  seed: number,
  options: { beam?: number; maxPieces?: number } = {},
): SolveResult {
  const beam = options.beam ?? 48;
  const cap = options.maxPieces ?? (stage.pieceCap > 0 ? stage.pieceCap : 60);
  const seq = pieceSequence({ pieceSet: stage.pieces }, seed, cap + 8);
  const initialStones = stage.stones.length;
  const done = (s: Omit<SearchState, "score">) =>
    allBlockGoalsDone(stage.goals, { ...s, board: s.board }, initialStones);
  let states: SearchState[] = [
    { board: buildStageStart(stage), hold: null, idx: 0, lines: 0, stoneRowsCleared: 0, multiClears: 0, pieces: 0, score: 0 },
  ];
  for (let step = 0; step < cap; step++) {
    const next: SearchState[] = [];
    for (const st of states) {
      const choices: Array<{ piece: PieceType; hold: PieceType | null; idx: number }> = [
        { piece: seq[st.idx]!, hold: st.hold, idx: st.idx + 1 },
      ];
      if (stage.hold) {
        if (st.hold == null) choices.push({ piece: seq[st.idx + 1]!, hold: seq[st.idx]!, idx: st.idx + 2 });
        else choices.push({ piece: st.hold, hold: seq[st.idx]!, idx: st.idx + 1 });
      }
      for (const choice of choices) {
        for (const p of listPlacements(st.board, choice.piece)) {
          const s = {
            board: p.board,
            hold: choice.hold,
            idx: choice.idx,
            lines: st.lines + p.lines,
            stoneRowsCleared: st.stoneRowsCleared + p.stoneRows,
            multiClears: st.multiClears + (p.lines >= 2 ? 1 : 0),
            pieces: st.pieces + 1,
          };
          if (done(s)) return { solved: true, pieces: s.pieces };
          next.push({ ...s, score: scoreSearchState(stage.goals, s, initialStones, stage.rows) });
        }
      }
    }
    if (next.length === 0) break;
    next.sort((a, b) => b.score - a.score);
    states = next.slice(0, beam);
  }
  return { solved: false, pieces: cap };
}
