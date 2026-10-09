/**
 * 《繽紛樂園》落點列舉與盤面特徵：解題器與模擬共用（純函式）。
 * 只考慮從出生列直直落下的落點（不含塞入懸空下方），比真人能做到的更保守。
 */

import { freshGame, refill, type EngineConfig } from "./engine";
import { ghostY, merge, SHAPES, valid, type Board, type PieceType } from "./pieces";
import { seededRng } from "./rng";

export type Placement = {
  rot: number;
  x: number;
  y: number;
  board: Board;
  lines: number;
  stoneRows: number;
};

const shapeKey = (type: PieceType, rot: number): string =>
  SHAPES[type][rot]
    .map(([c, r]) => `${c},${r}`)
    .sort()
    .join("|");

/** 去掉形狀相同的方向（O 只有一種、I／S／Z 兩種位置差一欄但形狀同時仍各自列出） */
function uniqueRotations(type: PieceType): number[] {
  const seen = new Set<string>();
  const out: number[] = [];
  for (let rot = 0; rot < 4; rot++) {
    const key = shapeKey(type, rot);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(rot);
  }
  return out;
}

function clearFullRows(board: Board): { board: Board; lines: number; stoneRows: number } {
  const cols = board[0]?.length ?? 0;
  const kept = board.filter((row) => !row.every(Boolean));
  const lines = board.length - kept.length;
  const stoneRows = board.filter((row) => row.every(Boolean) && row.includes("X")).length;
  while (kept.length < board.length) kept.unshift(Array(cols).fill(null));
  return { board: kept, lines, stoneRows };
}

export function listPlacements(board: Board, type: PieceType): Placement[] {
  const cols = board[0]?.length ?? 0;
  const out: Placement[] = [];
  for (const rot of uniqueRotations(type)) {
    for (let x = -3; x < cols; x++) {
      const piece = { type, rot, x, y: 0 };
      if (!valid(piece, board)) continue;
      const y = ghostY(piece, board);
      const merged = merge({ ...piece, y }, board);
      const cleared = clearFullRows(merged);
      out.push({ rot, x, y, board: cleared.board, lines: cleared.lines, stoneRows: cleared.stoneRows });
    }
  }
  return out;
}

export type BoardFeatures = { aggregate: number; holes: number; bumpiness: number; maxHeight: number };

export function boardFeatures(board: Board): BoardFeatures {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const heights = Array.from({ length: cols }, (_, c) => {
    const top = board.findIndex((row) => row[c]);
    return top < 0 ? 0 : rows - top;
  });
  let holes = 0;
  for (let c = 0; c < cols; c++) {
    let seen = false;
    for (let r = 0; r < rows; r++) {
      if (board[r]![c]) seen = true;
      else if (seen) holes++;
    }
  }
  const bumpiness = heights.slice(1).reduce((s, h, i) => s + Math.abs(h - heights[i]!), 0);
  return {
    aggregate: heights.reduce((s, h) => s + h, 0),
    holes,
    bumpiness,
    maxHeight: Math.max(0, ...heights),
  };
}

/** 依 seed 重現引擎 7-bag 出塊順序（與 engine.refill 相同）。 */
export function pieceSequence(config: Pick<EngineConfig, "pieceSet">, seed: number, count: number): PieceType[] {
  const g = freshGame();
  const ctx = { config: config as EngineConfig, rng: seededRng(seed), events: [] };
  const out: PieceType[] = [];
  while (out.length < count) {
    refill(g, ctx);
    out.push(g.bag.shift()!);
  }
  return out;
}
