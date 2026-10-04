/**
 * 《繽紛消消樂》目標導向的步評分：提示與模擬的貪婪策略共用。
 * 只看交換後第一波的確定性結果（不含隨機補格），所以同一盤面評分固定。
 */

import {
  DROP_ITEM,
  emptySpecials,
  isGiftDropSwap,
  listLegalMoves,
  planWaveClears,
  swapped,
  swappedSpecials,
  type BoardState,
} from "./engine";
import { goalStatus, type CandyGoal, type CandyProgress } from "./tasks";

export type CandyMove = { a: number; b: number };

const W = {
  cell: 1,
  needPiece: 10,
  anyPiece: 3,
  dirt: 12,
  detonate: 16,
  spawn: 8,
  spawnForDetonate: 10,
  giftRow: 7,
} as const;

/** 交換後第一波要清的格、引爆與新特殊糖（不改盤面）。 */
export function previewSwap(state: BoardState, move: CandyMove) {
  const specials = state.specials ?? emptySpecials(state.pieces.length);
  const pieces = swapped(state.pieces, move.a, move.b);
  const nextSpecials = swappedSpecials(specials, move.a, move.b);
  const extra = new Set<number>();
  if (nextSpecials[move.a] !== "none") extra.add(move.a);
  if (nextSpecials[move.b] !== "none") extra.add(move.b);
  const planned = planWaveClears(
    pieces,
    nextSpecials,
    state.cols,
    state.rows,
    extra.size > 0 ? extra : undefined,
    [move.a, move.b],
  );
  return { pieces, specials: nextSpecials, ...planned };
}

function unmet(goals: readonly CandyGoal[], progress: CandyProgress) {
  const need = { pieces: new Map<number, number>(), any: 0, dirt: 0, drop: 0, detonate: 0 };
  for (const goal of goals) {
    const status = goalStatus(goal, progress);
    if (status.done) continue;
    switch (goal.kind) {
      case "collect":
        need.pieces.set(goal.piece, (need.pieces.get(goal.piece) ?? 0) + status.remaining);
        break;
      case "collect-any":
        need.any += status.remaining;
        break;
      case "clean-dirt":
        need.dirt += status.remaining;
        break;
      case "drop-item":
        need.drop += status.remaining;
        break;
      case "detonate":
        need.detonate += status.remaining;
        break;
    }
  }
  return need;
}

/** 單步分數：越能推進「尚未完成」的目標越高。 */
export function scoreMove(
  state: BoardState,
  move: CandyMove,
  goals: readonly CandyGoal[],
  progress: CandyProgress,
): number {
  const need = unmet(goals, progress);
  if (isGiftDropSwap(state.pieces, move.a, move.b, state.cols)) {
    return need.drop > 0 ? W.giftRow : 0;
  }
  const preview = previewSwap(state, move);
  let score = preview.clear.size * W.cell;
  const pieceGain = new Map<number, number>();
  for (const i of preview.clear) {
    const v = preview.pieces[i];
    if (v >= 0) pieceGain.set(v, (pieceGain.get(v) ?? 0) + 1);
    if (state.dirt[i] && need.dirt > 0) score += W.dirt;
  }
  for (const [piece, n] of pieceGain) {
    score += Math.min(n, need.pieces.get(piece) ?? 0) * W.needPiece;
    if (need.any > 0) score += n * W.anyPiece;
  }
  if (need.detonate > 0) score += Math.min(preview.detonated.length, need.detonate) * W.detonate;
  score += preview.spawns.length * (W.spawn + (need.detonate > 0 ? W.spawnForDetonate : 0));
  if (need.drop > 0) score += giftProgress(state, preview.pieces, preview.clear) * W.giftRow;
  return score;
}

/** 這一波清掉禮物正下方幾格（禮物會往下掉幾列）。 */
function giftProgress(state: BoardState, pieces: number[], clear: Set<number>): number {
  let rows = 0;
  pieces.forEach((v, i) => {
    if (v !== DROP_ITEM) return;
    for (let below = i + state.cols; below < pieces.length; below += state.cols) {
      if (clear.has(below)) rows += 1;
    }
  });
  return rows;
}

/** 目標導向提示：分數最高的合法交換；沒有合法步回傳 null。 */
export function findGoalHint(
  state: BoardState,
  goals: readonly CandyGoal[],
  progress: CandyProgress,
): CandyMove | null {
  let best: CandyMove | null = null;
  let bestScore = -1;
  for (const move of listLegalMoves(state)) {
    const score = scoreMove(state, move, goals, progress);
    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }
  return best;
}
