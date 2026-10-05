/**
 * 《繽紛消消樂》十關 × 兩種玩法的任務配置。
 * 第一次進關（尚未通關）用固定的教學主線；通關後重玩才抽同等難度的變體。
 * 數值是第一輪起點，依 scripts/candy-match-sim.ts 的固定 seed 模擬與試玩再調。
 */

import { CANDY_MATCH_LEVELS, type CandyMatchLevel } from "./levels";
import { pickIndex } from "./rng";
import type { Rng } from "./engine";
import type { CandyGoal, CandyProgress } from "./tasks";

export type CandyMode = "easy" | "challenge";

export type CandyStage = {
  id: string;
  /** 重玩變體的短標籤 */
  label: string;
  goals: readonly CandyGoal[];
  /** 0 = 不限步數 */
  moves: number;
  pieceKinds: number;
  /** 髒格區域模板（格子索引） */
  dirtCells?: readonly number[];
  /** 厚污漬：dirtCells 裡要掃兩次的格子 */
  thickDirtCells?: readonly number[];
  /** 禮物數（頂排、不同欄） */
  dropCount?: number;
  /** 開局保證有一步能做出特殊糖 */
  requireSpecialMove?: boolean;
  /** 效率星：輕鬆＝有效交換不超過此數；挑戰＝剩餘步數至少此數 */
  efficiency: number;
};

export type CandyStageSet = {
  main: CandyStage;
  variants: readonly CandyStage[];
};

export type CandyProps = { bubble: number; rainbow: number; broom: number };

export type CandyMatchRound = CandyMatchLevel & {
  mode: CandyMode;
  stage: CandyStage;
  props: CandyProps;
  /** true＝已通關後的重玩（抽變體） */
  replay: boolean;
};

const C6 = 6;
const cells = (coords: ReadonlyArray<readonly [number, number]>): number[] =>
  coords.map(([c, r]) => r * C6 + c);
const block = (c0: number, c1: number, r0: number, r1: number): number[] => {
  const out: number[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(r * C6 + c);
  return out;
};

/** 6×7 髒格區域模板：中央、四角、底部、兩側。 */
export const CANDY_DIRT_TEMPLATES = {
  center8: cells([[2, 2], [3, 2], [1, 3], [2, 3], [3, 3], [4, 3], [2, 4], [3, 4]]),
  corners8: cells([[0, 0], [1, 0], [4, 0], [5, 0], [0, 6], [1, 6], [4, 6], [5, 6]]),
  bottom8: block(1, 4, 5, 6),
  top8: block(1, 4, 0, 1),
  middle18: block(0, 5, 2, 4),
  sides8: [...block(0, 0, 2, 5), ...block(5, 5, 2, 5)],
  center12: block(1, 4, 2, 4),
  corners12: cells([
    [0, 0], [1, 0], [0, 1], [5, 0], [4, 0], [5, 1],
    [0, 6], [1, 6], [0, 5], [5, 6], [4, 6], [5, 5],
  ]),
  bottom12: block(1, 4, 4, 6),
  sides12: [...block(0, 0, 1, 6), ...block(5, 5, 1, 6)],
} as const;

const T = CANDY_DIRT_TEMPLATES;
const collect = (piece: number, count: number): CandyGoal => ({ kind: "collect", piece, count });
const collectEach = (pieces: readonly number[], count: number): CandyGoal[] =>
  pieces.map((piece) => collect(piece, count));
const detonate = (count: number): CandyGoal => ({ kind: "detonate", count });

type StageInit = Omit<CandyStage, "label"> & { label?: string };

function stage(init: StageInit): CandyStage {
  return { ...init, label: init.label ?? "主線" };
}

const EASY: readonly CandyStageSet[] = [
  {
    main: stage({ id: "e1-any-50", goals: [{ kind: "collect-any", count: 50 }], moves: 0, pieceKinds: 4, efficiency: 6 }),
    variants: [
      stage({ id: "e1-red-13", label: "小紅收藏家", goals: [collect(0, 13)], moves: 0, pieceKinds: 4, efficiency: 6 }),
      stage({ id: "e1-taxi-13", label: "計程車收藏家", goals: [collect(1, 13)], moves: 0, pieceKinds: 4, efficiency: 6 }),
      stage({ id: "e1-bus-13", label: "小巴士收藏家", goals: [collect(2, 13)], moves: 0, pieceKinds: 4, efficiency: 6 }),
    ],
  },
  {
    main: stage({ id: "e2-red-23", goals: [collect(0, 23)], moves: 0, pieceKinds: 4, efficiency: 9 }),
    variants: [
      stage({ id: "e2-taxi-23", label: "計程車任務", goals: [collect(1, 23)], moves: 0, pieceKinds: 4, efficiency: 9 }),
      stage({ id: "e2-bell-23", label: "鈴鈴任務", goals: [collect(3, 23)], moves: 0, pieceKinds: 4, efficiency: 9 }),
    ],
  },
  {
    main: stage({ id: "e3-red-taxi-25", goals: collectEach([0, 1], 25), moves: 0, pieceKinds: 4, efficiency: 11 }),
    variants: [
      stage({ id: "e3-bus-bell-25", label: "藍綠雙色", goals: collectEach([2, 3], 25), moves: 0, pieceKinds: 4, efficiency: 11 }),
      stage({ id: "e3-red-bus-25", label: "粉藍雙色", goals: collectEach([0, 2], 25), moves: 0, pieceKinds: 4, efficiency: 11 }),
    ],
  },
  {
    main: stage({ id: "e4-bus-33-sp1", goals: [collect(2, 33), detonate(1)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 12 }),
    variants: [
      stage({ id: "e4-red-33-sp1", label: "小紅特殊糖", goals: [collect(0, 33), detonate(1)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 12 }),
      stage({ id: "e4-bell-33-sp1", label: "鈴鈴特殊糖", goals: [collect(3, 33), detonate(1)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 12 }),
    ],
  },
  {
    main: stage({
      id: "e5-clean-bottom-8",
      goals: [{ kind: "clean-dirt", count: 8 }],
      moves: 0,
      pieceKinds: 4,
      dirtCells: T.bottom8,
      // 底部兩格是厚污漬，各要多清一次，效率星比單層髒格多留兩步。
      thickDirtCells: [32, 33],
      efficiency: 11,
    }),
    variants: [
      stage({ id: "e5-clean-sides-8", label: "打掃兩邊", goals: [{ kind: "clean-dirt", count: 8 }], moves: 0, pieceKinds: 4, dirtCells: T.sides8, efficiency: 10 }),
      stage({ id: "e5-clean-middle-18", label: "打掃中間", goals: [{ kind: "clean-dirt", count: 18 }], moves: 0, pieceKinds: 4, dirtCells: T.middle18, efficiency: 10 }),
      stage({ id: "e5-clean-corners-8", label: "打掃四個角", goals: [{ kind: "clean-dirt", count: 8 }], moves: 0, pieceKinds: 4, dirtCells: T.corners8, efficiency: 12 }),
    ],
  },
  {
    main: stage({ id: "e6-red-bell-39", goals: collectEach([0, 3], 39), moves: 0, pieceKinds: 4, efficiency: 14 }),
    variants: [
      stage({ id: "e6-taxi-bus-39", label: "黃藍雙色", goals: collectEach([1, 2], 39), moves: 0, pieceKinds: 4, efficiency: 14 }),
      stage({ id: "e6-red-bus-39", label: "粉藍雙色", goals: collectEach([0, 2], 39), moves: 0, pieceKinds: 4, efficiency: 14 }),
    ],
  },
  {
    main: stage({ id: "e7-taxi-48-sp2", goals: [collect(1, 48), detonate(2)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 16 }),
    variants: [
      stage({ id: "e7-red-48-sp2", label: "小紅亮起來", goals: [collect(0, 48), detonate(2)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 16 }),
      stage({ id: "e7-bell-48-sp2", label: "鈴鈴亮起來", goals: [collect(3, 48), detonate(2)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 16 }),
    ],
  },
  {
    main: stage({ id: "e8-gift-2", goals: [{ kind: "drop-item", count: 2 }], moves: 0, pieceKinds: 4, dropCount: 2, efficiency: 17 }),
    variants: [
      stage({ id: "e8-gift-2-red-6", label: "禮物加小紅", goals: [{ kind: "drop-item", count: 2 }, collect(0, 6)], moves: 0, pieceKinds: 4, dropCount: 2, efficiency: 17 }),
      stage({ id: "e8-gift-2-sp1", label: "禮物加特殊糖", goals: [{ kind: "drop-item", count: 2 }, detonate(1)], moves: 0, pieceKinds: 4, dropCount: 2, efficiency: 17 }),
    ],
  },
  {
    main: stage({ id: "e9-red-bus-bell-51", goals: collectEach([0, 2, 3], 51), moves: 0, pieceKinds: 4, efficiency: 19 }),
    variants: [
      stage({ id: "e9-taxi-bus-bell-51", label: "換隊大遊行", goals: collectEach([1, 2, 3], 51), moves: 0, pieceKinds: 4, efficiency: 19 }),
      stage({ id: "e9-red-taxi-bell-51", label: "彩虹大遊行", goals: collectEach([0, 1, 3], 51), moves: 0, pieceKinds: 4, efficiency: 19 }),
    ],
  },
  {
    main: stage({ id: "e10-three-58-sp3", goals: [...collectEach([0, 1, 2], 58), detonate(3)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 21 }),
    variants: [
      stage({ id: "e10-three-58-sp3-b", label: "煙火換色", goals: [...collectEach([1, 2, 3], 58), detonate(3)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 21 }),
      stage({ id: "e10-three-58-sp3-c", label: "煙火大合唱", goals: [...collectEach([0, 2, 3], 58), detonate(3)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 21 }),
    ],
  },
];

const CHALLENGE: readonly CandyStageSet[] = [
  {
    main: stage({ id: "c1-any-92", goals: [{ kind: "collect-any", count: 92 }], moves: 12, efficiency: 4, pieceKinds: 4 }),
    variants: [
      stage({ id: "c1-red-24", label: "小紅收藏家", goals: [collect(0, 24)], moves: 12, efficiency: 4, pieceKinds: 4 }),
      stage({ id: "c1-taxi-24", label: "計程車收藏家", goals: [collect(1, 24)], moves: 12, efficiency: 4, pieceKinds: 4 }),
    ],
  },
  {
    main: stage({ id: "c2-red-32", goals: [collect(0, 32)], moves: 14, efficiency: 4, pieceKinds: 4 }),
    variants: [
      stage({ id: "c2-taxi-30", label: "計程車任務", goals: [collect(1, 30)], moves: 14, efficiency: 4, pieceKinds: 4 }),
      stage({ id: "c2-bell-30", label: "鈴鈴任務", goals: [collect(3, 30)], moves: 14, efficiency: 4, pieceKinds: 4 }),
    ],
  },
  {
    main: stage({ id: "c3-red-taxi-36", goals: collectEach([0, 1], 36), moves: 16, efficiency: 4, pieceKinds: 4 }),
    variants: [
      stage({ id: "c3-bus-bell-36", label: "藍綠雙色", goals: collectEach([2, 3], 36), moves: 16, efficiency: 4, pieceKinds: 4 }),
      stage({ id: "c3-red-bus-36", label: "粉藍雙色", goals: collectEach([0, 2], 36), moves: 16, efficiency: 4, pieceKinds: 4 }),
    ],
  },
  {
    main: stage({ id: "c4-bus-50-sp2", goals: [collect(2, 50), detonate(2)], moves: 18, efficiency: 4, pieceKinds: 4, requireSpecialMove: true }),
    variants: [
      stage({ id: "c4-red-53-sp2", label: "小紅特殊糖", goals: [collect(0, 53), detonate(2)], moves: 18, efficiency: 4, pieceKinds: 4, requireSpecialMove: true }),
      stage({ id: "c4-bell-47-sp2", label: "鈴鈴特殊糖", goals: [collect(3, 47), detonate(2)], moves: 18, efficiency: 4, pieceKinds: 4, requireSpecialMove: true }),
    ],
  },
  {
    main: stage({ id: "c5-clean-bottom-12-red-50", goals: [{ kind: "clean-dirt", count: 12 }, collect(0, 50)], moves: 18, efficiency: 3, pieceKinds: 4, dirtCells: T.bottom12 }),
    variants: [
      stage({ id: "c5-clean-corners-12-taxi-43", label: "打掃四個角", goals: [{ kind: "clean-dirt", count: 12 }, collect(1, 43)], moves: 18, efficiency: 3, pieceKinds: 4, dirtCells: T.corners12 }),
      stage({ id: "c5-clean-sides-12-bus-44", label: "打掃兩邊", goals: [{ kind: "clean-dirt", count: 12 }, collect(2, 44)], moves: 18, efficiency: 3, pieceKinds: 4, dirtCells: T.sides12 }),
    ],
  },
  {
    main: stage({ id: "c6-red-bell-31", goals: collectEach([0, 3], 31), moves: 24, efficiency: 4, pieceKinds: 5 }),
    variants: [
      stage({ id: "c6-taxi-bus-32", label: "黃藍雙色", goals: collectEach([1, 2], 32), moves: 24, efficiency: 4, pieceKinds: 5 }),
      stage({ id: "c6-red-bus-32", label: "粉藍雙色", goals: collectEach([0, 2], 32), moves: 24, efficiency: 4, pieceKinds: 5 }),
    ],
  },
  {
    main: stage({ id: "c7-taxi-40-sp3", goals: [collect(1, 40), detonate(3)], moves: 26, efficiency: 4, pieceKinds: 5, requireSpecialMove: true }),
    variants: [
      stage({ id: "c7-red-40-sp3", label: "小紅亮起來", goals: [collect(0, 40), detonate(3)], moves: 26, efficiency: 4, pieceKinds: 5, requireSpecialMove: true }),
      stage({ id: "c7-bell-40-sp3", label: "鈴鈴亮起來", goals: [collect(3, 40), detonate(3)], moves: 26, efficiency: 4, pieceKinds: 5, requireSpecialMove: true }),
    ],
  },
  {
    main: stage({ id: "c8-gift-3-red-30", goals: [{ kind: "drop-item", count: 3 }, collect(0, 30)], moves: 26, efficiency: 4, pieceKinds: 5, dropCount: 3 }),
    variants: [
      stage({ id: "c8-gift-3-taxi-33", label: "禮物加計程車", goals: [{ kind: "drop-item", count: 3 }, collect(1, 33)], moves: 26, efficiency: 4, pieceKinds: 5, dropCount: 3 }),
      stage({ id: "c8-gift-3-bell-31", label: "禮物加鈴鈴", goals: [{ kind: "drop-item", count: 3 }, collect(3, 31)], moves: 26, efficiency: 4, pieceKinds: 5, dropCount: 3 }),
    ],
  },
  {
    main: stage({ id: "c9-red-bus-bell-38", goals: collectEach([0, 2, 3], 38), moves: 28, efficiency: 3, pieceKinds: 5 }),
    variants: [
      stage({ id: "c9-taxi-bus-bell-38", label: "換隊大遊行", goals: collectEach([1, 2, 3], 38), moves: 28, efficiency: 3, pieceKinds: 5 }),
      stage({ id: "c9-red-taxi-bell-38", label: "彩虹大遊行", goals: collectEach([0, 1, 3], 38), moves: 28, efficiency: 3, pieceKinds: 5 }),
    ],
  },
  {
    main: stage({ id: "c10-three-40-sp4", goals: [...collectEach([0, 1, 2], 40), detonate(4)], moves: 30, efficiency: 3, pieceKinds: 5, requireSpecialMove: true }),
    variants: [
      stage({ id: "c10-three-42-sp4-b", label: "煙火換色", goals: [...collectEach([1, 2, 3], 42), detonate(4)], moves: 30, efficiency: 3, pieceKinds: 5, requireSpecialMove: true }),
      stage({ id: "c10-three-42-sp4-c", label: "煙火大合唱", goals: [...collectEach([0, 2, 3], 42), detonate(4)], moves: 30, efficiency: 3, pieceKinds: 5, requireSpecialMove: true }),
    ],
  },
];

export const CANDY_STAGES: Readonly<Record<CandyMode, readonly CandyStageSet[]>> = {
  easy: EASY,
  challenge: CHALLENGE,
};

export const CANDY_MODES: readonly { id: CandyMode; label: string; hint: string }[] = [
  { id: "easy", label: "輕鬆冒險", hint: "不限步數，慢慢找" },
  { id: "challenge", label: "挑戰冒險", hint: "有步數限制，想一想再換" },
];

/** 道具次數：輕鬆第 2 關起有彩虹；挑戰第 4 關起有彩虹、泡泡只有 1 次。 */
export function candyProps(mode: CandyMode, levelIndex: number): CandyProps {
  if (mode === "challenge") {
    return { bubble: 1, broom: 1, rainbow: levelIndex >= 3 ? 1 : 0 };
  }
  return { bubble: 2, broom: 1, rainbow: levelIndex >= 1 ? 1 : 0 };
}

export function stageSet(mode: CandyMode, levelIndex: number): CandyStageSet {
  const set = CANDY_STAGES[mode][levelIndex];
  if (!set) throw new Error(`Missing Candy stage for ${mode} level ${levelIndex}`);
  return set;
}

/** 重玩變體：避免連續抽到上一次的配置；池只有一項時照常可玩。 */
export function selectVariant(
  mode: CandyMode,
  levelIndex: number,
  previousId: string | undefined,
  rng: Rng,
): CandyStage {
  const { main, variants } = stageSet(mode, levelIndex);
  const pool = variants.length > 0 ? variants : [main];
  const choices = pool.length > 1 ? pool.filter((s) => s.id !== previousId) : pool;
  return choices[pickIndex(choices.length, rng)] ?? pool[0]!;
}

/** 組出一局：第一次進關用主線，已通關的重玩抽變體。 */
export function buildRound(
  levelIndex: number,
  mode: CandyMode,
  options: { replay: boolean; previousId?: string; rng: Rng },
): CandyMatchRound {
  const level = CANDY_MATCH_LEVELS[levelIndex];
  if (!level) throw new Error(`Missing Candy level ${levelIndex}`);
  const chosen = options.replay
    ? selectVariant(mode, levelIndex, options.previousId, options.rng)
    : stageSet(mode, levelIndex).main;
  return {
    ...level,
    mode,
    stage: chosen,
    props: candyProps(mode, levelIndex),
    replay: options.replay,
  };
}

/** 第三顆星（效率星）是否達成。 */
export function efficiencyMet(
  round: Pick<CandyMatchRound, "stage">,
  progress: Pick<CandyProgress, "swaps">,
  movesLeft: number,
): boolean {
  if (round.stage.moves > 0) return movesLeft >= round.stage.efficiency;
  return progress.swaps <= round.stage.efficiency;
}

/** 靜態檢查：任務合理、物件數足夠、圖案在本關範圍內。 */
export function isStageFeasible(level: CandyMatchLevel, s: CandyStage): boolean {
  if (s.moves < 0 || s.goals.length === 0) return false;
  if (s.pieceKinds < 3 || s.pieceKinds > 5) return false;
  const total = level.cols * level.rows;
  return s.goals.every((goal) => {
    if (goal.count <= 0) return false;
    switch (goal.kind) {
      case "collect":
        return goal.piece >= 0 && goal.piece < s.pieceKinds;
      case "clean-dirt": {
        const dirt = s.dirtCells ?? [];
        const thick = s.thickDirtCells ?? [];
        const dirtSet = new Set(dirt);
        return (
          dirt.length >= goal.count &&
          dirt.every((i) => i >= 0 && i < total) &&
          thick.every((i) => dirtSet.has(i))
        );
      }
      case "drop-item":
        return (s.dropCount ?? 0) >= goal.count && (s.dropCount ?? 0) <= level.cols;
      case "collect-any":
      case "detonate":
        return true;
    }
  });
}
