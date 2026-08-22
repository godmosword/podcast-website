import type { CandyMatchLevel, CandyMatchTask } from "./levels";

export type CandyMatchChallenge = {
  id: string;
  label: string;
  task: CandyMatchTask;
  moves?: number;
  dirtCount?: number;
  dropCount?: number;
};

/**
 * 小而經過整理的挑戰池：只重組既有任務，不引入新的消除規則。
 * 早期關卡保留低壓暖身；後期才逐步加入多目標與步數壓力。
 */
export const CANDY_CURATED_CHALLENGE_POOL: Readonly<Record<number, readonly CandyMatchChallenge[]>> = {
  0: [
    { id: "warmup-waves-3", label: "暖身三連", task: { kind: "clear-any", count: 3 } },
    { id: "warmup-waves-5", label: "多找兩波", task: { kind: "clear-any", count: 5 } },
  ],
  1: [
    { id: "collect-red-5", label: "小紅收藏家", task: { kind: "collect", piece: 0, count: 5 } },
    { id: "collect-taxi-5", label: "計程車收藏家", task: { kind: "collect", piece: 1, count: 5 } },
  ],
  2: [
    { id: "collect-taxi-6", label: "黃色小任務", task: { kind: "collect", piece: 1, count: 6 }, moves: 24 },
    { id: "collect-red-6", label: "粉紅小任務", task: { kind: "collect", piece: 0, count: 6 }, moves: 24 },
    {
      id: "collect-pair-3",
      label: "雙色配對",
      task: { kind: "collect-multi", targets: [{ piece: 0, count: 3 }, { piece: 1, count: 3 }] },
      moves: 26,
    },
  ],
  3: [
    { id: "collect-bus-8", label: "小巴士巡遊", task: { kind: "collect", piece: 2, count: 8 }, moves: 26 },
    {
      id: "collect-parade-4",
      label: "兩色小遊行",
      task: { kind: "collect-multi", targets: [{ piece: 0, count: 4 }, { piece: 2, count: 4 }] },
      moves: 28,
    },
  ],
  4: [
    { id: "clean-dirt-4", label: "輕鬆打掃", task: { kind: "clean-dirt", count: 4 }, moves: 30, dirtCount: 4 },
    { id: "clean-dirt-5", label: "廣場大掃除", task: { kind: "clean-dirt", count: 5 }, moves: 30, dirtCount: 5 },
  ],
  5: [
    { id: "collect-bell-8", label: "鈴鈴派對", task: { kind: "collect", piece: 3, count: 8 }, moves: 28 },
    {
      id: "collect-party-4",
      label: "派對雙色舞",
      task: { kind: "collect-multi", targets: [{ piece: 0, count: 4 }, { piece: 3, count: 4 }] },
      moves: 30,
    },
  ],
  6: [
    { id: "collect-taxi-6-wheel", label: "摩天輪收集", task: { kind: "collect", piece: 1, count: 6 }, moves: 26 },
    { id: "collect-red-7-wheel", label: "摩天輪加碼", task: { kind: "collect", piece: 0, count: 7 }, moves: 28 },
  ],
  7: [
    { id: "drop-gift-1", label: "送一份禮物", task: { kind: "drop-item", count: 1 }, moves: 30, dropCount: 1 },
    { id: "drop-gift-1-pressure", label: "禮物快遞", task: { kind: "drop-item", count: 1 }, moves: 26, dropCount: 1 },
  ],
  8: [
    {
      id: "parade-pink-bus-bell",
      label: "三色大遊行",
      task: { kind: "collect-multi", targets: [{ piece: 0, count: 5 }, { piece: 2, count: 5 }, { piece: 3, count: 5 }] },
      moves: 34,
    },
    {
      id: "parade-pink-taxi-bus",
      label: "彩虹換隊伍",
      task: { kind: "collect-multi", targets: [{ piece: 0, count: 4 }, { piece: 1, count: 4 }, { piece: 2, count: 4 }] },
      moves: 34,
    },
  ],
  9: [
    { id: "fireworks-waves-10", label: "煙火十連", task: { kind: "clear-any", count: 10 } },
    { id: "fireworks-waves-12", label: "煙火大加碼", task: { kind: "clear-any", count: 12 } },
  ],
};

function cloneTask(task: CandyMatchTask): CandyMatchTask {
  switch (task.kind) {
    case "collect-multi":
      return { ...task, targets: task.targets.map((target) => ({ ...target })) };
    default:
      return { ...task };
  }
}

/** 將一個 curated challenge 套到既有關卡，不改地圖、棋盤或 scoring。 */
export function applyCandyChallenge(
  level: CandyMatchLevel,
  challenge: CandyMatchChallenge,
): CandyMatchLevel {
  return {
    ...level,
    task: cloneTask(challenge.task),
    moves: challenge.moves ?? level.moves,
    dirtCount: challenge.task.kind === "clean-dirt" ? challenge.dirtCount ?? level.dirtCount : undefined,
    dropCount: challenge.task.kind === "drop-item" ? challenge.dropCount ?? level.dropCount : undefined,
    challengeId: challenge.id,
    challengeLabel: challenge.label,
  };
}

/** 避免同一關 replay 立刻抽到同一個挑戰；池只有一項時仍可正常遊玩。 */
export function selectCandyChallenge(
  levelIndex: number,
  previousId: string | undefined,
  rng: () => number,
): CandyMatchChallenge {
  const pool = CANDY_CURATED_CHALLENGE_POOL[levelIndex];
  if (!pool || pool.length === 0) {
    throw new Error(`Missing Candy challenge pool for level ${levelIndex}`);
  }
  const choices = pool.length > 1 ? pool.filter((challenge) => challenge.id !== previousId) : pool;
  const index = Math.min(choices.length - 1, Math.floor(Math.max(0, rng()) * choices.length));
  return choices[index] ?? choices[0]!;
}

/** 靜態檢查 pool 的任務是否符合該關既有 mechanics 與配置。 */
export function isCandyChallengeFeasible(
  level: CandyMatchLevel,
  challenge: CandyMatchChallenge,
): boolean {
  const task = challenge.task;
  if (challenge.moves != null && challenge.moves < 0) return false;
  switch (task.kind) {
    case "clear-any":
    case "collect":
      return task.count > 0 && (task.kind !== "collect" || task.piece < level.pieceKinds);
    case "collect-multi":
      return task.targets.length > 1 && task.targets.every(
        (target) => target.count > 0 && target.piece < level.pieceKinds,
      );
    case "clean-dirt":
      return task.count > 0 && (challenge.dirtCount ?? level.dirtCount ?? 0) >= task.count;
    case "drop-item":
      return task.count > 0 && (challenge.dropCount ?? level.dropCount ?? 0) >= task.count;
  }
}
