/**
 * 《繽紛消消樂》任務判定：可組合目標、進度聚合與任務文案。純函數。
 * 統計事件由引擎產生（ResolveEvents），這裡只負責累加與判定。
 */

import type { ResolveEvents } from "./engine";

export const CANDY_PIECE_NAMES = ["小紅", "計程車", "小巴士", "鈴鈴", "多多"] as const;

export type CandyGoal =
  | { kind: "collect-any"; count: number }
  | { kind: "collect"; piece: number; count: number }
  | { kind: "clean-dirt"; count: number }
  | { kind: "drop-item"; count: number }
  /** 啟動棋盤特殊糖（含連鎖引爆）；工具列道具本身不算 */
  | { kind: "detonate"; count: number };

export type CandyGoalKind = CandyGoal["kind"];

export type CandyProgress = {
  collected: number[];
  cleaned: number;
  dropped: number;
  detonated: number;
  specialsMade: number;
  waves: number;
  /** 有效交換次數：成功的交換才算；無效交換、提示與道具不算 */
  swaps: number;
};

export type CandyGoalStatus = {
  got: number;
  need: number;
  remaining: number;
  done: boolean;
};

export function freshCandyProgress(kinds: number = CANDY_PIECE_NAMES.length): CandyProgress {
  return {
    collected: Array<number>(kinds).fill(0),
    cleaned: 0,
    dropped: 0,
    detonated: 0,
    specialsMade: 0,
    waves: 0,
    swaps: 0,
  };
}

type EventLike = Pick<
  ResolveEvents,
  "collected" | "cleaned" | "dropped" | "detonated" | "specialsMade" | "waves"
>;

/** 把一次解算的事件加進進度（回傳新物件）。 */
export function applyEvents(progress: CandyProgress, events: EventLike): CandyProgress {
  const len = Math.max(progress.collected.length, events.collected.length);
  return {
    ...progress,
    collected: Array.from(
      { length: len },
      (_, i) => (progress.collected[i] ?? 0) + (events.collected[i] ?? 0),
    ),
    cleaned: progress.cleaned + events.cleaned,
    dropped: progress.dropped + events.dropped,
    detonated: progress.detonated + events.detonated,
    specialsMade: progress.specialsMade + events.specialsMade,
    waves: progress.waves + events.waves,
  };
}

export function countSwap(progress: CandyProgress): CandyProgress {
  return { ...progress, swaps: progress.swaps + 1 };
}

function goalGot(goal: CandyGoal, p: CandyProgress): number {
  switch (goal.kind) {
    case "collect-any":
      return p.collected.reduce((a, b) => a + b, 0);
    case "collect":
      return p.collected[goal.piece] ?? 0;
    case "clean-dirt":
      return p.cleaned;
    case "drop-item":
      return p.dropped;
    case "detonate":
      return p.detonated;
  }
}

export function goalStatus(goal: CandyGoal, p: CandyProgress): CandyGoalStatus {
  const need = goal.count;
  const got = Math.min(need, goalGot(goal, p));
  return { got, need, remaining: need - got, done: got >= need };
}

/** 複合任務必須全部完成。 */
export function allGoalsDone(goals: readonly CandyGoal[], p: CandyProgress): boolean {
  return goals.length > 0 && goals.every((goal) => goalStatus(goal, p).done);
}

/** 整體完成度 0..1（進度條用）。 */
export function goalCompletion(goals: readonly CandyGoal[], p: CandyProgress): number {
  const need = goals.reduce((sum, goal) => sum + goal.count, 0);
  if (need <= 0) return 0;
  const got = goals.reduce((sum, goal) => sum + goalStatus(goal, p).got, 0);
  return Math.min(1, got / need);
}

function pieceName(piece: number): string {
  return CANDY_PIECE_NAMES[piece] ?? "圖案";
}

function unit(goal: CandyGoal): string {
  switch (goal.kind) {
    case "clean-dirt":
      return "格";
    case "detonate":
      return "次";
    default:
      return "個";
  }
}

/** 目標短名，例如「收集小紅」。 */
export function goalTitle(goal: CandyGoal): string {
  switch (goal.kind) {
    case "collect-any":
      return "收集任意圖案";
    case "collect":
      return `收集${pieceName(goal.piece)}`;
    case "clean-dirt":
      return "打掃髒髒格";
    case "drop-item":
      return "把禮物送到底";
    case "detonate":
      return "啟動特殊糖";
  }
}

/** 剩餘量文案，例如「還差 12 個」；完成時為「完成」。 */
export function goalRemainingLabel(goal: CandyGoal, p: CandyProgress): string {
  const status = goalStatus(goal, p);
  return status.done ? "完成" : `還差 ${status.remaining} ${unit(goal)}`;
}

/** 任務列的一句話，例如「收集小紅，還差 12 個」。 */
export function goalLine(goal: CandyGoal, p: CandyProgress): string {
  return `${goalTitle(goal)}，${goalRemainingLabel(goal, p)}`;
}

/** 地圖卡任務摘要，例如「收集小紅、計程車各 12 個＋啟動特殊糖 1 次」。 */
export function goalsSummary(goals: readonly CandyGoal[]): string {
  const parts: string[] = [];
  const collects = goals.filter(
    (goal): goal is Extract<CandyGoal, { kind: "collect" }> => goal.kind === "collect",
  );
  if (collects.length > 0) {
    const sameCount = collects.every((goal) => goal.count === collects[0]!.count);
    if (collects.length > 1 && sameCount) {
      parts.push(`收集${collects.map((goal) => pieceName(goal.piece)).join("、")}各 ${collects[0]!.count} 個`);
    } else {
      parts.push(`收集${collects.map((goal) => `${pieceName(goal.piece)} ${goal.count} 個`).join("、")}`);
    }
  }
  for (const goal of goals) {
    switch (goal.kind) {
      case "collect-any":
        parts.push(`收集任意圖案 ${goal.count} 個`);
        break;
      case "clean-dirt":
        parts.push(`清理 ${goal.count} 格髒格`);
        break;
      case "drop-item":
        parts.push(`送達 ${goal.count} 個禮物`);
        break;
      case "detonate":
        parts.push(`啟動特殊糖 ${goal.count} 次`);
        break;
      default:
        break;
    }
  }
  return parts.join("＋");
}

/** 背景主題用的任務類別。 */
export function goalTheme(goals: readonly CandyGoal[]): string {
  if (goals.some((goal) => goal.kind === "drop-item")) return "drop-item";
  if (goals.some((goal) => goal.kind === "clean-dirt")) return "clean-dirt";
  if (goals.filter((goal) => goal.kind === "collect").length > 1) return "collect-multi";
  return goals[0]?.kind ?? "collect-any";
}
