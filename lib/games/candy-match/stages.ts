/**
 * 《繽紛消消樂》十關 × 兩種玩法的任務配置。
 * 第一次進關（尚未通關）用固定的教學主線；通關後重玩才抽同等難度的變體。
 * 數值是第一輪起點，依 scripts/candy-match-sim.ts 的固定 seed 模擬與試玩再調。
 */

import { CANDY_MATCH_LEVELS, CANDY_MATCH_PIECES, CANDY_PIECE, type CandyMatchLevel } from "./levels";
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
  /**
   * 這一關上場的車（CANDY_MATCH_PIECES 索引）。
   * 長度等於 pieceKinds。沒寫時用前 pieceKinds 台。
   * 陣列下標對應舊的 0..n-1 槽位，所以換車不改同場種類、也不改模擬難度。
   */
  palette?: readonly number[];
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
const CANDY_DIRT_TEMPLATES = {
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

const { red: RED, taxi: TAXI, bus: BUS, bell: BELL, duo: DUO, ambulance: AMB, fire: FIRE, train: TRAIN } =
  CANDY_PIECE;

/** 同一關的主線與變體共用一份上場名單，種類數跟名單長度走。 */
function pack(palette: readonly number[], main: StageInit, variants: StageInit[]): CandyStageSet {
  const apply = (init: StageInit): CandyStage => stage({ ...init, palette, pieceKinds: palette.length });
  return { main: apply(main), variants: variants.map(apply) };
}

/** 這一關實際會出現的車。 */
export function stagePalette(stage: Pick<CandyStage, "pieceKinds" | "palette">): readonly number[] {
  if (stage.palette && stage.palette.length > 0) return stage.palette;
  return Array.from({ length: stage.pieceKinds }, (_, i) => i);
}

const CLASSIC4 = [RED, TAXI, BUS, BELL] as const;
/** 輕鬆第 1 關維持原本四台，後面各關輪進新車，同場仍是 4 種。 */
const EASY: readonly CandyStageSet[] = [
  pack(CLASSIC4, { id: "e1-any-50", goals: [{ kind: "collect-any", count: 50 }], moves: 0, pieceKinds: 4, efficiency: 6 }, [
    { id: "e1-red-13", label: "小紅收藏家", goals: [collect(RED, 13)], moves: 0, pieceKinds: 4, efficiency: 6 },
    { id: "e1-taxi-13", label: "計程車收藏家", goals: [collect(TAXI, 13)], moves: 0, pieceKinds: 4, efficiency: 6 },
    { id: "e1-bus-13", label: "小巴士收藏家", goals: [collect(BUS, 13)], moves: 0, pieceKinds: 4, efficiency: 6 },
  ]),
  // 第 2 關：救護車取代小紅當收集目標。
  pack([AMB, TAXI, BUS, BELL], { id: "e2-ambulance-23", goals: [collect(AMB, 23)], moves: 0, pieceKinds: 4, efficiency: 9 }, [
    { id: "e2-taxi-23", label: "計程車任務", goals: [collect(TAXI, 23)], moves: 0, pieceKinds: 4, efficiency: 9 },
    { id: "e2-bell-23", label: "鈴鈴任務", goals: [collect(BELL, 23)], moves: 0, pieceKinds: 4, efficiency: 9 },
  ]),
  // 第 3 關：小火車進場，主線仍收小紅與計程車。
  pack([RED, TAXI, BUS, TRAIN], { id: "e3-red-taxi-25", goals: collectEach([RED, TAXI], 25), moves: 0, pieceKinds: 4, efficiency: 11 }, [
    { id: "e3-bus-train-25", label: "藍火車雙色", goals: collectEach([BUS, TRAIN], 25), moves: 0, pieceKinds: 4, efficiency: 11 },
    { id: "e3-red-bus-25", label: "粉藍雙色", goals: collectEach([RED, BUS], 25), moves: 0, pieceKinds: 4, efficiency: 11 },
  ]),
  pack([RED, TAXI, BUS, AMB], { id: "e4-bus-33-sp1", goals: [collect(BUS, 33), detonate(1)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 12 }, [
    { id: "e4-red-33-sp1", label: "小紅特殊糖", goals: [collect(RED, 33), detonate(1)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 12 },
    { id: "e4-ambulance-33-sp1", label: "救護車特殊糖", goals: [collect(AMB, 33), detonate(1)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 12 },
  ]),
  pack(
    [TAXI, BUS, BELL, FIRE],
    {
      id: "e5-clean-bottom-8",
      goals: [{ kind: "clean-dirt", count: 8 }],
      moves: 0,
      pieceKinds: 4,
      dirtCells: T.bottom8,
      // 底部兩格是厚污漬，各要多清一次，效率星比單層髒格多留兩步。
      thickDirtCells: [32, 33],
      efficiency: 11,
    },
    [
      { id: "e5-clean-sides-8", label: "打掃兩邊", goals: [{ kind: "clean-dirt", count: 8 }], moves: 0, pieceKinds: 4, dirtCells: T.sides8, efficiency: 10 },
      { id: "e5-clean-middle-18", label: "打掃中間", goals: [{ kind: "clean-dirt", count: 18 }], moves: 0, pieceKinds: 4, dirtCells: T.middle18, efficiency: 10 },
      { id: "e5-clean-corners-8", label: "打掃四個角", goals: [{ kind: "clean-dirt", count: 8 }], moves: 0, pieceKinds: 4, dirtCells: T.corners8, efficiency: 12 },
    ],
  ),
  // 第 6 關：小紅、計程車、小巴士、救護車。
  pack([RED, TAXI, BUS, AMB], { id: "e6-red-ambulance-39", goals: collectEach([RED, AMB], 39), moves: 0, pieceKinds: 4, efficiency: 14 }, [
    { id: "e6-taxi-bus-39", label: "黃藍雙色", goals: collectEach([TAXI, BUS], 39), moves: 0, pieceKinds: 4, efficiency: 14 },
    { id: "e6-red-bus-39", label: "粉藍雙色", goals: collectEach([RED, BUS], 39), moves: 0, pieceKinds: 4, efficiency: 14 },
  ]),
  // 第 7–10 關收集收在每色約 25–35。消防車取代小紅，不跟小紅同場。
  pack([FIRE, TAXI, BUS, BELL], { id: "e7-taxi-30-sp2", goals: [collect(TAXI, 30), detonate(2)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 11 }, [
    { id: "e7-fire-30-sp2", label: "消防車亮起來", goals: [collect(FIRE, 30), detonate(2)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 11 },
    { id: "e7-bell-30-sp2", label: "鈴鈴亮起來", goals: [collect(BELL, 30), detonate(2)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 11 },
  ]),
  pack([FIRE, TAXI, BUS, BELL], { id: "e8-gift-2", goals: [{ kind: "drop-item", count: 2 }], moves: 0, pieceKinds: 4, dropCount: 2, efficiency: 17 }, [
    { id: "e8-gift-2-fire-6", label: "禮物加消防車", goals: [{ kind: "drop-item", count: 2 }, collect(FIRE, 6)], moves: 0, pieceKinds: 4, dropCount: 2, efficiency: 17 },
    { id: "e8-gift-2-sp1", label: "禮物加特殊糖", goals: [{ kind: "drop-item", count: 2 }, detonate(1)], moves: 0, pieceKinds: 4, dropCount: 2, efficiency: 17 },
  ]),
  pack([RED, TAXI, BUS, TRAIN], { id: "e9-red-bus-train-33", goals: collectEach([RED, BUS, TRAIN], 33), moves: 0, pieceKinds: 4, efficiency: 13 }, [
    { id: "e9-taxi-bus-train-33", label: "換隊大遊行", goals: collectEach([TAXI, BUS, TRAIN], 33), moves: 0, pieceKinds: 4, efficiency: 13 },
    { id: "e9-red-taxi-train-33", label: "彩虹大遊行", goals: collectEach([RED, TAXI, TRAIN], 33), moves: 0, pieceKinds: 4, efficiency: 13 },
  ]),
  pack([FIRE, TAXI, BUS, TRAIN], { id: "e10-fire-taxi-bus-35-sp3", goals: [...collectEach([FIRE, TAXI, BUS], 35), detonate(3)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 15 }, [
    { id: "e10-taxi-bus-train-35-sp3", label: "煙火換色", goals: [...collectEach([TAXI, BUS, TRAIN], 35), detonate(3)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 15 },
    { id: "e10-fire-bus-train-35-sp3", label: "煙火大合唱", goals: [...collectEach([FIRE, BUS, TRAIN], 35), detonate(3)], moves: 0, pieceKinds: 4, requireSpecialMove: true, efficiency: 15 },
  ]),
];

/**
 * 挑戰第 1–5 關 4 種、第 6 關起 5 種；新車輪進，多多仍在後期出場。
 * 前五關的顆數按「一次合法交換至少消 3 顆」來放：
 * 第 1 關任意收集 40／18 步 ≈ 2.2 顆／步，普通三連就清得掉（舊的 92／12 步要每步 7 顆以上）。
 * 單色約 0.9 顆／步，四種車裡找那一台就夠；雙色合計約 1.6 顆／步，接近隨機一半。
 * 第 6 關起維持原數字。輕鬆模式完全不動。
 */
const CHALLENGE: readonly CandyStageSet[] = [
  pack([RED, TAXI, BUS, AMB], { id: "c1-any-40", goals: [{ kind: "collect-any", count: 40 }], moves: 18, efficiency: 6, pieceKinds: 4 }, [
    { id: "c1-red-12", label: "小紅收藏家", goals: [collect(RED, 12)], moves: 18, efficiency: 6, pieceKinds: 4 },
    { id: "c1-taxi-12", label: "計程車收藏家", goals: [collect(TAXI, 12)], moves: 18, efficiency: 6, pieceKinds: 4 },
  ]),
  pack([AMB, TAXI, BUS, BELL], { id: "c2-ambulance-18", goals: [collect(AMB, 18)], moves: 20, efficiency: 5, pieceKinds: 4 }, [
    { id: "c2-taxi-16", label: "計程車任務", goals: [collect(TAXI, 16)], moves: 20, efficiency: 5, pieceKinds: 4 },
    { id: "c2-bell-16", label: "鈴鈴任務", goals: [collect(BELL, 16)], moves: 20, efficiency: 5, pieceKinds: 4 },
  ]),
  pack([RED, TAXI, BUS, TRAIN], { id: "c3-red-taxi-18", goals: collectEach([RED, TAXI], 18), moves: 22, efficiency: 5, pieceKinds: 4 }, [
    { id: "c3-bus-train-18", label: "藍火車雙色", goals: collectEach([BUS, TRAIN], 18), moves: 22, efficiency: 5, pieceKinds: 4 },
    { id: "c3-red-bus-18", label: "粉藍雙色", goals: collectEach([RED, BUS], 18), moves: 22, efficiency: 5, pieceKinds: 4 },
  ]),
  pack([FIRE, TAXI, BUS, BELL], { id: "c4-bus-18-sp2", goals: [collect(BUS, 18), detonate(2)], moves: 22, efficiency: 4, pieceKinds: 4, requireSpecialMove: true }, [
    { id: "c4-fire-16-sp2", label: "消防車特殊糖", goals: [collect(FIRE, 16), detonate(2)], moves: 22, efficiency: 4, pieceKinds: 4, requireSpecialMove: true },
    { id: "c4-bell-14-sp2", label: "鈴鈴特殊糖", goals: [collect(BELL, 14), detonate(2)], moves: 22, efficiency: 4, pieceKinds: 4, requireSpecialMove: true },
  ]),
  pack([FIRE, TAXI, BUS, BELL], { id: "c5-clean-bottom-12-fire-18", goals: [{ kind: "clean-dirt", count: 12 }, collect(FIRE, 18)], moves: 24, efficiency: 4, pieceKinds: 4, dirtCells: T.bottom12 }, [
    { id: "c5-clean-corners-12-taxi-16", label: "打掃四個角", goals: [{ kind: "clean-dirt", count: 12 }, collect(TAXI, 16)], moves: 24, efficiency: 4, pieceKinds: 4, dirtCells: T.corners12 },
    { id: "c5-clean-sides-12-bus-16", label: "打掃兩邊", goals: [{ kind: "clean-dirt", count: 12 }, collect(BUS, 16)], moves: 24, efficiency: 4, pieceKinds: 4, dirtCells: T.sides12 },
  ]),
  pack([RED, TAXI, BUS, AMB, DUO], { id: "c6-red-ambulance-31", goals: collectEach([RED, AMB], 31), moves: 24, efficiency: 4, pieceKinds: 5 }, [
    { id: "c6-taxi-bus-32", label: "黃藍雙色", goals: collectEach([TAXI, BUS], 32), moves: 24, efficiency: 4, pieceKinds: 5 },
    { id: "c6-red-bus-32", label: "粉藍雙色", goals: collectEach([RED, BUS], 32), moves: 24, efficiency: 4, pieceKinds: 5 },
  ]),
  pack([FIRE, TAXI, BUS, BELL, DUO], { id: "c7-taxi-40-sp3", goals: [collect(TAXI, 40), detonate(3)], moves: 26, efficiency: 4, pieceKinds: 5, requireSpecialMove: true }, [
    { id: "c7-fire-40-sp3", label: "消防車亮起來", goals: [collect(FIRE, 40), detonate(3)], moves: 26, efficiency: 4, pieceKinds: 5, requireSpecialMove: true },
    { id: "c7-bell-40-sp3", label: "鈴鈴亮起來", goals: [collect(BELL, 40), detonate(3)], moves: 26, efficiency: 4, pieceKinds: 5, requireSpecialMove: true },
  ]),
  pack([FIRE, TAXI, BUS, BELL, TRAIN], { id: "c8-gift-3-fire-30", goals: [{ kind: "drop-item", count: 3 }, collect(FIRE, 30)], moves: 26, efficiency: 4, pieceKinds: 5, dropCount: 3 }, [
    { id: "c8-gift-3-taxi-33", label: "禮物加計程車", goals: [{ kind: "drop-item", count: 3 }, collect(TAXI, 33)], moves: 26, efficiency: 4, pieceKinds: 5, dropCount: 3 },
    { id: "c8-gift-3-bell-31", label: "禮物加鈴鈴", goals: [{ kind: "drop-item", count: 3 }, collect(BELL, 31)], moves: 26, efficiency: 4, pieceKinds: 5, dropCount: 3 },
  ]),
  pack([RED, TAXI, BUS, TRAIN, DUO], { id: "c9-red-bus-train-38", goals: collectEach([RED, BUS, TRAIN], 38), moves: 28, efficiency: 3, pieceKinds: 5 }, [
    { id: "c9-taxi-bus-train-38", label: "換隊大遊行", goals: collectEach([TAXI, BUS, TRAIN], 38), moves: 28, efficiency: 3, pieceKinds: 5 },
    { id: "c9-red-taxi-train-38", label: "彩虹大遊行", goals: collectEach([RED, TAXI, TRAIN], 38), moves: 28, efficiency: 3, pieceKinds: 5 },
  ]),
  pack([FIRE, TAXI, BUS, TRAIN, DUO], { id: "c10-fire-taxi-bus-40-sp4", goals: [...collectEach([FIRE, TAXI, BUS], 40), detonate(4)], moves: 30, efficiency: 3, pieceKinds: 5, requireSpecialMove: true }, [
    { id: "c10-taxi-bus-train-42-sp4", label: "煙火換色", goals: [...collectEach([TAXI, BUS, TRAIN], 42), detonate(4)], moves: 30, efficiency: 3, pieceKinds: 5, requireSpecialMove: true },
    { id: "c10-fire-bus-train-42-sp4", label: "煙火大合唱", goals: [...collectEach([FIRE, BUS, TRAIN], 42), detonate(4)], moves: 30, efficiency: 3, pieceKinds: 5, requireSpecialMove: true },
  ]),
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

function stageSet(mode: CandyMode, levelIndex: number): CandyStageSet {
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

/** 靜態檢查：任務合理、物件數足夠、圖案在本關上場名單裡。 */
export function isStageFeasible(level: CandyMatchLevel, s: CandyStage): boolean {
  if (s.moves < 0 || s.goals.length === 0) return false;
  if (s.pieceKinds < 3 || s.pieceKinds > 5) return false;
  const palette = stagePalette(s);
  if (palette.length !== s.pieceKinds) return false;
  if (new Set(palette).size !== palette.length) return false;
  if (palette.some((id) => !Number.isInteger(id) || id < 0 || id >= CANDY_MATCH_PIECES.length)) return false;
  // 橘紅消防車與莓紅小紅色盲下太近，不排同一關。
  if (palette.includes(CANDY_PIECE.red) && palette.includes(CANDY_PIECE.fire)) return false;
  const total = level.cols * level.rows;
  return s.goals.every((goal) => {
    if (goal.count <= 0) return false;
    switch (goal.kind) {
      case "collect":
        return palette.includes(goal.piece);
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
