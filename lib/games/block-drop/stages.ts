/**
 * 《繽紛樂園》任務冒險：十站 × 兩種玩法。
 * 第一次進站用固定主線；通關後重玩抽同難度變體（缺口左右鏡像、平移）。
 * 數值是第一輪起點，依 scripts/block-drop-sim.ts 的固定 seed 模擬與試玩再調。
 *
 * 石頭模板由下往上逐排描述（"X"＝石頭、"."＝缺口），一律「沒有懸空」：
 * 某排的缺口正上方那排也必須是缺口，方塊直直落下就放得進去。
 */

import type { EngineConfig, GameState } from "./engine";
import { allBlockGoalsDone, stoneRowCount, type BlockGoal } from "./goals";
import { emptyBoard, type Board, type PieceType } from "./pieces";
import { pickIndex, type Rng } from "./rng";
import { SOFT_DROP_MS } from "./scoring";

export type BlockMode = "easy" | "challenge";

export type BlockStation = {
  index: number;
  name: string;
  /** 本站新概念（教學句，≤8 字） */
  concept: string;
};

export type BlockStage = {
  id: string;
  label: string;
  cols: number;
  rows: number;
  pieces: readonly PieceType[];
  hold: boolean;
  goals: readonly BlockGoal[];
  /** 由下往上 */
  stones: readonly string[];
  /** 0＝不限塊數（輕鬆） */
  pieceCap: number;
  /** 第三顆星：幾塊內完成 */
  efficiency: number;
  /** false＝不自動落下（按 ↓ 才落） */
  autoFall: boolean;
  /** 從頂落到底的秒數 */
  fallSeconds: number;
};

export type BlockStageSet = { main: BlockStage; variants: readonly BlockStage[] };

export type BlockRound = {
  station: BlockStation;
  mode: BlockMode;
  stage: BlockStage;
  replay: boolean;
};

export const BLOCK_STATIONS: readonly BlockStation[] = [
  { index: 0, name: "積木小屋", concept: "左右移、落下" },
  { index: 1, name: "旋轉茶杯", concept: "轉一轉再放" },
  { index: 2, name: "轉角花園", concept: "L 形補角落" },
  { index: 3, name: "雙層蛋糕", concept: "一次消兩排" },
  { index: 4, name: "口袋車站", concept: "暫存先放著" },
  { index: 5, name: "帳篷營地", concept: "T 形缺口" },
  { index: 6, name: "彎彎滑梯", concept: "S 形缺口" },
  { index: 7, name: "階梯城堡", concept: "從高往低清" },
  { index: 8, name: "大樓工地", concept: "連續消排" },
  { index: 9, name: "煙火塔", concept: "綜合挑戰" },
];

const OI: readonly PieceType[] = ["O", "I"];
const OILJ: readonly PieceType[] = ["O", "I", "L", "J"];
const OILJT: readonly PieceType[] = ["O", "I", "L", "J", "T"];
const ALL: readonly PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

type Base = Omit<BlockStage, "id" | "label" | "pieceCap" | "efficiency" | "autoFall" | "fallSeconds" | "goals">;

const BASES: readonly Base[] = [
  { cols: 8, rows: 14, pieces: OI, hold: false, stones: ["X..XXXXX", "X..X..XX"] },
  { cols: 8, rows: 14, pieces: OI, hold: false, stones: ["XXXXXX.X", "XXXXXX.X", "X.XXXX.X", "X.XXXX.X"] },
  { cols: 8, rows: 14, pieces: OILJ, hold: false, stones: ["XXX.XXXX", "XXX...XX"] },
  { cols: 8, rows: 14, pieces: OILJ, hold: false, stones: ["XX..XXXX", "XX..XXXX"] },
  { cols: 8, rows: 16, pieces: OILJ, hold: true, stones: ["XXXX.XXX", "XXXX.XXX", "XXXX.XXX"] },
  { cols: 8, rows: 16, pieces: OILJT, hold: true, stones: ["XXXXX.XX", "XXX.X.XX", "XX....XX"] },
  { cols: 8, rows: 16, pieces: ALL, hold: true, stones: ["XX..XXXX", "XX...XXX"] },
  { cols: 8, rows: 16, pieces: ALL, hold: true, stones: ["XXXXXXX.", "XXXXXX..", "XXXXX...", "XXXX...."] },
  { cols: 8, rows: 16, pieces: ALL, hold: true, stones: ["XXX.XXXX", "XXX.XX.X"] },
  { cols: 8, rows: 16, pieces: ALL, hold: true, stones: ["X.XXXXXX", "X.XXX.XX", "X..XX.XX", "X..X..XX"] },
];

/** 挑戰模式另有石頭模板的站（目前沒有；第 4 站改成「第二次一次消 2 排要自己疊」）。 */
const CHALLENGE_STONES: Readonly<Record<number, readonly string[]>> = {};

type Tune = { goals: readonly BlockGoal[]; pieceCap: number; efficiency: number };

const rows = (count: number): BlockGoal => ({ kind: "clear-rows", count });
const STONES: BlockGoal = { kind: "clear-stones" };
const multi = (count: number): BlockGoal => ({ kind: "multi-clear", count });

const EASY_TUNE: readonly Tune[] = [
  { goals: [rows(2)], pieceCap: 0, efficiency: 5 },
  { goals: [rows(4)], pieceCap: 0, efficiency: 6 },
  { goals: [STONES], pieceCap: 0, efficiency: 4 },
  { goals: [multi(1)], pieceCap: 0, efficiency: 5 },
  { goals: [STONES], pieceCap: 0, efficiency: 5 },
  { goals: [STONES], pieceCap: 0, efficiency: 6 },
  { goals: [STONES], pieceCap: 0, efficiency: 6 },
  { goals: [STONES], pieceCap: 0, efficiency: 8 },
  { goals: [rows(6)], pieceCap: 0, efficiency: 16 },
  { goals: [STONES, rows(8)], pieceCap: 0, efficiency: 20 },
];

const CHALLENGE_TUNE: readonly Tune[] = [
  { goals: [rows(3)], pieceCap: 10, efficiency: 7 },
  { goals: [rows(5)], pieceCap: 12, efficiency: 9 },
  { goals: [STONES, rows(3)], pieceCap: 14, efficiency: 10 },
  { goals: [multi(1), rows(4)], pieceCap: 18, efficiency: 10 },
  { goals: [STONES, rows(5)], pieceCap: 12, efficiency: 10 },
  { goals: [STONES, rows(6)], pieceCap: 18, efficiency: 13 },
  { goals: [STONES, rows(6)], pieceCap: 17, efficiency: 13 },
  { goals: [STONES, rows(8)], pieceCap: 19, efficiency: 16 },
  { goals: [rows(9)], pieceCap: 22, efficiency: 20 },
  { goals: [STONES, rows(10)], pieceCap: 32, efficiency: 26 },
];

/** 輕鬆：約 9 秒從頂落到底、不隨站加速；第 1–2 站不自動落下（D5）。挑戰：6 秒逐站縮到 4 秒。 */
const easyFall = (): number => 9;
const challengeFall = (i: number): number => Math.round((6 - (2 * i) / 9) * 10) / 10;

export const mirrorStones = (stones: readonly string[]): string[] =>
  stones.map((row) => [...row].reverse().join(""));

/** 右移一欄（只在每排最右都是石頭時，避免缺口繞到另一邊）。 */
export const shiftStones = (stones: readonly string[]): string[] | null =>
  stones.every((row) => row.endsWith("X")) ? stones.map((row) => `X${row.slice(0, -1)}`) : null;

function makeStage(mode: BlockMode, i: number, stones: readonly string[], suffix: string, label: string): BlockStage {
  const base = BASES[i]!;
  const tune = (mode === "easy" ? EASY_TUNE : CHALLENGE_TUNE)[i]!;
  return {
    ...base,
    stones,
    id: `${mode === "easy" ? "e" : "c"}${i + 1}-${suffix}`,
    label,
    goals: tune.goals,
    pieceCap: tune.pieceCap,
    efficiency: tune.efficiency,
    autoFall: mode === "challenge" || i >= 2,
    fallSeconds: mode === "easy" ? easyFall() : challengeFall(i),
  };
}

function stageSetFor(mode: BlockMode, i: number): BlockStageSet {
  const stones = (mode === "challenge" ? CHALLENGE_STONES[i] : undefined) ?? BASES[i]!.stones;
  const main = makeStage(mode, i, stones, "main", "主線");
  const variants: BlockStage[] = [makeStage(mode, i, mirrorStones(stones), "mirror", "左右換邊")];
  const shifted = shiftStones(stones);
  if (shifted) variants.push(makeStage(mode, i, shifted, "shift", "缺口換位置"));
  return { main, variants };
}

export const BLOCK_STAGES: Readonly<Record<BlockMode, readonly BlockStageSet[]>> = {
  easy: BLOCK_STATIONS.map((s) => stageSetFor("easy", s.index)),
  challenge: BLOCK_STATIONS.map((s) => stageSetFor("challenge", s.index)),
};

export function blockStageSet(mode: BlockMode, index: number): BlockStageSet {
  const set = BLOCK_STAGES[mode][index];
  if (!set) throw new Error(`Missing block-drop stage ${mode} ${index}`);
  return set;
}

/** 第一次進站（尚未通關）用主線；重玩抽變體並避開上一次。 */
export function buildBlockRound(
  index: number,
  mode: BlockMode,
  options: { replay: boolean; previousId?: string; rng: Rng },
): BlockRound {
  const station = BLOCK_STATIONS[index];
  if (!station) throw new Error(`Missing block-drop station ${index}`);
  const set = blockStageSet(mode, index);
  let stage = set.main;
  if (options.replay) {
    const pool = [set.main, ...set.variants];
    const choices = pool.length > 1 ? pool.filter((s) => s.id !== options.previousId) : pool;
    stage = choices[pickIndex(choices.length, options.rng)] ?? set.main;
  }
  return { station, mode, stage, replay: options.replay };
}

/** 把石頭模板放進空棋盤（由下往上）。 */
export function stageBoard(stage: Pick<BlockStage, "cols" | "rows" | "stones">): Board {
  const board = emptyBoard(stage.cols, stage.rows);
  stage.stones.forEach((pattern, k) => {
    const y = stage.rows - 1 - k;
    board[y] = [...pattern].map((ch) => (ch === "X" ? "X" : null));
  });
  return board;
}

export const dangerRowFor = (rows: number): number => Math.round(rows * 0.2);

/** 任務冒險的引擎設定（計劃 §4 速度、救援、塊數、危險線、完成判定）。 */
export function stageEngineConfig(round: Pick<BlockRound, "mode" | "stage">): EngineConfig {
  const { stage, mode } = round;
  const initialStoneRows = stage.stones.length;
  const rowMs = (stage.fallSeconds * 1000) / stage.rows;
  return {
    gravityInterval: (_level, softDrop) => (softDrop ? SOFT_DROP_MS : rowMs),
    lockDelayMs: mode === "easy" ? 620 : 450,
    scoreMultiplier: 1,
    rescueLimit: mode === "easy" ? 2 : 0,
    rescueKind: mode === "easy" ? "halfStack" : "top4",
    levelUp: false,
    rainbow: false,
    pieceSet: stage.pieces,
    holdEnabled: stage.hold,
    autoFall: stage.autoFall,
    pieceCap: stage.pieceCap,
    dangerRow: dangerRowFor(stage.rows),
    isComplete: (g: GameState) => allBlockGoalsDone(stage.goals, g, initialStoneRows),
  };
}

/** 三顆星：完成任務／沒越過危險線／N 塊內完成（兩種玩法相同）。 */
export function blockStars(stage: Pick<BlockStage, "efficiency">, g: Pick<GameState, "crossedLine" | "pieces">) {
  const flawless = !g.crossedLine;
  const efficient = g.pieces <= stage.efficiency;
  return { flawless, efficient, stars: 1 + (flawless ? 1 : 0) + (efficient ? 1 : 0) };
}

export { stoneRowCount };
