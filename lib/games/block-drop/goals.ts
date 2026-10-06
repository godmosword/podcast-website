/**
 * 《繽紛樂園》任務冒險目標：判定與文案（純函式）。
 * 計數來自引擎 GameState 的統計欄位（lines、stoneRowsCleared、multiClears、pieces），
 * View 與結算不各自判斷。清掉一排石頭同時算消一排。
 */

import type { GameState } from "./engine";
import type { Board } from "./pieces";

export type BlockGoal =
  /** 消 N 排（含石頭排） */
  | { kind: "clear-rows"; count: number }
  /** 清完盤面上所有石頭 */
  | { kind: "clear-stones" }
  /** 一次消 2 排以上，累計 N 次 */
  | { kind: "multi-clear"; count: number };

export type BlockGoalStatus = { got: number; need: number; remaining: number; done: boolean };

export const stoneRowCount = (board: Board): number => board.filter((row) => row.includes("X")).length;

type Stats = Pick<GameState, "lines" | "stoneRowsCleared" | "multiClears" | "board">;

export function blockGoalStatus(goal: BlockGoal, g: Stats, initialStoneRows: number): BlockGoalStatus {
  switch (goal.kind) {
    case "clear-rows": {
      const got = Math.min(goal.count, g.lines);
      return { got, need: goal.count, remaining: goal.count - got, done: got >= goal.count };
    }
    case "clear-stones": {
      const left = stoneRowCount(g.board);
      const got = Math.max(0, initialStoneRows - left);
      return { got, need: initialStoneRows, remaining: left, done: left === 0 };
    }
    case "multi-clear": {
      const got = Math.min(goal.count, g.multiClears);
      return { got, need: goal.count, remaining: goal.count - got, done: got >= goal.count };
    }
  }
}

export function allBlockGoalsDone(goals: readonly BlockGoal[], g: Stats, initialStoneRows: number): boolean {
  return goals.length > 0 && goals.every((goal) => blockGoalStatus(goal, g, initialStoneRows).done);
}

/** 目標短名（任務列與地圖卡）。用詞統一「排」。 */
export function blockGoalTitle(goal: BlockGoal): string {
  switch (goal.kind) {
    case "clear-rows":
      return `消 ${goal.count} 排`;
    case "clear-stones":
      return "清完石頭";
    case "multi-clear":
      return goal.count > 1 ? `一次消 2 排 ×${goal.count}` : "一次消 2 排";
  }
}

export function blockGoalRemainingLabel(goal: BlockGoal, g: Stats, initialStoneRows: number): string {
  const s = blockGoalStatus(goal, g, initialStoneRows);
  if (s.done) return "完成";
  switch (goal.kind) {
    case "clear-rows":
      return `還差 ${s.remaining} 排`;
    case "clear-stones":
      return `還有 ${s.remaining} 排石頭`;
    case "multi-clear":
      return `還差 ${s.remaining} 次`;
  }
}

export function blockGoalsSummary(goals: readonly BlockGoal[]): string {
  return goals.map(blockGoalTitle).join("＋");
}
