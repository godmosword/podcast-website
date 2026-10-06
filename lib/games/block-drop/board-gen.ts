/**
 * 《繽紛樂園》任務盤生成檢查（計劃「可解」第 1 點）：石頭模板與開局盤面的不變量。
 */

import type { Board } from "./pieces";
import { dangerRowFor, stageBoard, type BlockStage } from "./stages";

/** 出生區保留列數（出生列＋旋轉空間）。 */
const SPAWN_ROWS = 4;

export function stoneTemplateIssues(stage: Pick<BlockStage, "cols" | "rows" | "stones">): string[] {
  const issues: string[] = [];
  const { cols, rows, stones } = stage;
  stones.forEach((row, k) => {
    if (row.length !== cols) issues.push(`第 ${k} 排寬度 ${row.length} ≠ ${cols}`);
    if (!row.includes(".")) issues.push(`第 ${k} 排沒有缺口`);
    if (!row.includes("X")) issues.push(`第 ${k} 排沒有石頭`);
    const above = stones[k + 1];
    if (above) {
      [...row].forEach((ch, c) => {
        if (ch === "." && above[c] === "X") issues.push(`第 ${k} 排第 ${c} 欄缺口上方有石頭（懸空）`);
      });
    }
  });
  if (stones.length > rows - dangerRowFor(rows) - SPAWN_ROWS) issues.push("石頭太高，會碰到危險線與出生區");
  return issues;
}

/** 開局盤面：石頭排數正確、沒有已滿的排、危險線以上與出生區全空。 */
export function isValidStageStart(board: Board, stage: Pick<BlockStage, "cols" | "rows" | "stones">): boolean {
  if (board.length !== stage.rows || board.some((row) => row.length !== stage.cols)) return false;
  if (board.some((row) => row.every(Boolean))) return false;
  if (board.filter((row) => row.includes("X")).length !== stage.stones.length) return false;
  const clearTop = stage.rows - stage.stones.length;
  return board.slice(0, clearTop).every((row) => row.every((c) => c === null));
}

export function buildStageStart(stage: BlockStage): Board {
  const board = stageBoard(stage);
  if (!isValidStageStart(board, stage)) throw new Error(`Invalid start board for ${stage.id}`);
  return board;
}
