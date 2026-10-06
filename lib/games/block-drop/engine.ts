/**
 * 《繽紛樂園》規則引擎：棋盤、方塊、7-bag、重力、鎖定延遲、消排、計分、升級、救援、到頂、暫存。
 *
 * 自由堆疊的規則原樣搬自 BlockDropView（黃金回放逐步比對）：GameState 保持可變物件，
 * 函式就地修改；音效、toast、震動、教學、adapter 回報等副作用改成事件，由 View 依序處理。
 * 任務冒險透過 EngineConfig 的額外欄位（塊數上限、危險線、完成判定、救援方式）掛上。
 */

import {
  emptyBoard,
  merge,
  SHAPES,
  KICKS,
  spawnX,
  TYPES,
  valid,
  boardCols,
  boardRows,
  type Board,
  type Cell,
  type Piece,
  type PieceType,
} from "./pieces";
import {
  CLEAR_ANIM_MS,
  FREE_DIFFICULTY,
  gravityMs,
  LINE_SCORE,
  LINES_PER_LEVEL,
  LOCK_RESET_LIMIT,
  SOFT_DROP_MS,
} from "./scoring";
import type { BlockDropDifficultyPreference } from "@/lib/progress-store";
import type { Rng } from "./rng";

export type Status = "ready" | "playing" | "paused" | "over" | "won";
export type OverReason = "topout" | "outOfPieces" | "wrapUp" | null;

export interface GameState {
  board: Board;
  active: Piece | null;
  bag: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  combo: number;
  status: Status;
  grounded: boolean;
  lockTimer: number;
  resets: number;
  dropAcc: number;
  softDrop: boolean;
  clearing: boolean;
  clearRows: number[];
  clearUntil: number;
  rescues: number;
  overReason: OverReason;
  lastTime: number | null;
  dirty: boolean;
  metaReported: boolean;
  /** 任務冒險統計（自由堆疊不使用） */
  pieces: number;
  stoneRowsCleared: number;
  multiClears: number;
  crossedLine: boolean;
}

/** top4＝清上方 4 列（自由堆疊）；halfStack＝清掉石頭以上所有玩家方塊（任務冒險輕鬆）。 */
export type RescueKind = "top4" | "halfStack";

export type EngineConfig = {
  /** 每下降一格的毫秒數 */
  gravityInterval: (level: number, softDrop: boolean) => number;
  lockDelayMs: number;
  scoreMultiplier: number;
  rescueLimit: number;
  rescueKind: RescueKind;
  levelUp: boolean;
  /** 彩虹模式：連擊時額外加分 */
  rainbow: boolean;
  pieceSet: readonly PieceType[];
  holdEnabled: boolean;
  /** false＝不自動落下，只有按住往下才落 */
  autoFall: boolean;
  /** 0＝不限塊數 */
  pieceCap: number;
  /** 盤面高於這一列（列索引小於此值）就算越過危險線 */
  dangerRow: number;
  /** 任務完成判定；自由堆疊為 undefined */
  isComplete?: (g: GameState) => boolean;
};

export type EngineEvent =
  | { type: "lockStart" }
  | { type: "moved" }
  | { type: "rotated" }
  | { type: "spawned" }
  | { type: "locked"; piece: Piece }
  | { type: "clearStart"; rows: number[] }
  | { type: "cleared"; n: number; lineScore: number; combo: number; stoneRows: number }
  | { type: "comboBonus"; bonus: number; combo: number }
  | { type: "rainbowBonus"; bonus: number }
  | { type: "perfectClear"; bonus: number }
  | { type: "levelUp"; level: number }
  | { type: "hardDropped"; rows: number }
  | { type: "held" }
  | { type: "rescued"; score: number }
  | { type: "crossedLine" }
  | { type: "won"; score: number }
  | { type: "gameOver"; reason: OverReason; score: number; report: boolean };

export type EngineContext = {
  readonly config: EngineConfig;
  rng: Rng;
  events: EngineEvent[];
};

/** 自由堆疊設定：數值與現行完全相同。 */
export function freeModeConfig(
  difficulty: BlockDropDifficultyPreference,
  rainbow: boolean,
): EngineConfig {
  const d = FREE_DIFFICULTY[difficulty];
  return {
    gravityInterval: (level, softDrop) => (softDrop ? SOFT_DROP_MS : gravityMs(level)) * d.gravityScale,
    lockDelayMs: d.lockDelayMs,
    scoreMultiplier: d.scoreMultiplier,
    rescueLimit: d.rescueLimit,
    rescueKind: "top4",
    levelUp: true,
    rainbow,
    pieceSet: TYPES,
    holdEnabled: true,
    autoFall: true,
    pieceCap: 0,
    dangerRow: 4,
  };
}

export function freshGame(cols = 10, rows = 20, board?: Board): GameState {
  return {
    board: board ? board.map((row) => row.slice()) : emptyBoard(cols, rows),
    active: null,
    bag: [],
    hold: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    combo: 0,
    status: "ready",
    grounded: false,
    lockTimer: 0,
    resets: 0,
    dropAcc: 0,
    softDrop: false,
    clearing: false,
    clearRows: [],
    clearUntil: 0,
    rescues: 0,
    overReason: null,
    lastTime: null,
    dirty: true,
    metaReported: false,
    pieces: 0,
    stoneRowsCleared: 0,
    multiClears: 0,
    crossedLine: false,
  };
}

const emit = (ctx: EngineContext, event: EngineEvent) => {
  ctx.events.push(event);
};

const scoreValue = (ctx: EngineContext, base: number): number =>
  Math.round(base * ctx.config.scoreMultiplier);

export function refill(g: GameState, ctx: EngineContext): void {
  while (g.bag.length <= 7) {
    const b = [...ctx.config.pieceSet];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(ctx.rng() * (i + 1));
      [b[i], b[j]] = [b[j]!, b[i]!];
    }
    g.bag.push(...b);
  }
}

export function updateGrounded(g: GameState): void {
  if (g.active) {
    g.grounded = !valid({ ...g.active, y: g.active.y + 1 }, g.board);
  }
}

function resetLock(g: GameState): void {
  if (g.grounded && g.resets < LOCK_RESET_LIMIT) {
    g.lockTimer = 0;
    g.resets++;
  }
}

/** 最高一排石頭的列索引；沒有石頭回傳 rows。 */
function topStoneRow(board: Board): number {
  const idx = board.findIndex((row) => row.includes("X"));
  return idx < 0 ? board.length : idx;
}

function rescue(g: GameState, ctx: EngineContext): void {
  const cols = boardCols(g.board);
  if (ctx.config.rescueKind === "halfStack") {
    // 清掉最高一排石頭以上、玩家放的所有方塊（石頭與已清的進度不動），給孩子乾淨的重來空間
    const limit = topStoneRow(g.board);
    for (let y = 0; y < limit; y++) g.board[y] = Array<Cell>(cols).fill(null);
  } else {
    for (let y = 0; y < 4; y++) g.board[y] = Array<Cell>(cols).fill(null);
  }
  if (g.active) {
    g.active.y = 0;
    g.active.x = spawnX(cols);
  }
  g.rescues += 1;
  g.status = "playing";
  g.overReason = null;
  g.metaReported = false;
  g.dirty = true;
  emit(ctx, { type: "rescued", score: g.score });
}

function gameOver(g: GameState, ctx: EngineContext, reason: OverReason): void {
  g.status = "over";
  g.overReason = reason;
  g.dirty = true;
  const report = !g.metaReported;
  if (report) g.metaReported = true;
  emit(ctx, { type: "gameOver", reason, score: g.score, report });
}

function topOut(g: GameState, ctx: EngineContext): void {
  if (g.rescues < ctx.config.rescueLimit) rescue(g, ctx);
  else gameOver(g, ctx, ctx.config.rescueKind === "halfStack" ? "wrapUp" : "topout");
}

export function spawnNext(g: GameState, ctx: EngineContext): void {
  refill(g, ctx);
  const type = g.bag.shift()!;
  g.active = { type, rot: 0, x: spawnX(boardCols(g.board)), y: 0 };
  g.canHold = true;
  g.grounded = false;
  g.lockTimer = 0;
  g.resets = 0;
  emit(ctx, { type: "spawned" });
  if (!valid(g.active, g.board)) {
    topOut(g, ctx);
  } else {
    updateGrounded(g);
  }
}

function stackCrossesLine(g: GameState, ctx: EngineContext): boolean {
  return g.board.slice(0, ctx.config.dangerRow).some((row) => row.some(Boolean));
}

/**
 * 一塊結算後的判定順序（計劃 §4）：任務完成 → 越線 → 塊數用完 → 生成下一塊（被擋即到頂）。
 * 自由堆疊沒有完成判定與塊數上限，等同直接生成下一塊。
 */
function afterSettle(g: GameState, ctx: EngineContext): void {
  const { config } = ctx;
  if (config.isComplete?.(g)) {
    g.status = "won";
    g.active = null;
    g.dirty = true;
    const report = !g.metaReported;
    if (report) g.metaReported = true;
    emit(ctx, { type: "won", score: g.score });
    return;
  }
  if (config.isComplete && !g.crossedLine && stackCrossesLine(g, ctx)) {
    g.crossedLine = true;
    emit(ctx, { type: "crossedLine" });
  }
  if (config.pieceCap > 0 && g.pieces >= config.pieceCap) {
    g.active = null;
    gameOver(g, ctx, "outOfPieces");
    return;
  }
  spawnNext(g, ctx);
}

export function finishClear(g: GameState, ctx: EngineContext): void {
  const set = new Set(g.clearRows);
  const stoneRows = g.clearRows.filter((y) => g.board[y]?.includes("X")).length;
  const nb = g.board.filter((_, y) => !set.has(y));
  const cols = boardCols(g.board);
  while (nb.length < boardRows(g.board)) nb.unshift(Array<Cell>(cols).fill(null));
  g.board = nb;
  const n = g.clearRows.length;
  g.lines += n;
  g.stoneRowsCleared += stoneRows;
  if (n >= 2) g.multiClears += 1;
  const lineScore = scoreValue(ctx, LINE_SCORE[n] * g.level);
  g.score += lineScore;
  g.combo += 1;
  emit(ctx, { type: "cleared", n, lineScore, combo: g.combo, stoneRows });
  if (g.combo >= 2) {
    const bonus = scoreValue(ctx, 50 * (g.combo - 1) * g.level);
    g.score += bonus;
    emit(ctx, { type: "comboBonus", bonus, combo: g.combo });
  }
  if (ctx.config.rainbow && g.combo >= 2) {
    const bonus = scoreValue(ctx, 120 * g.combo * n);
    g.score += bonus;
    emit(ctx, { type: "rainbowBonus", bonus });
  }
  if (g.board.every((row) => row.every((c) => !c))) {
    const bonus = scoreValue(ctx, 1000 * g.level);
    g.score += bonus;
    emit(ctx, { type: "perfectClear", bonus });
  }
  if (ctx.config.levelUp) {
    const lv = Math.floor(g.lines / LINES_PER_LEVEL) + 1;
    if (lv > g.level) {
      g.level = lv;
      emit(ctx, { type: "levelUp", level: lv });
    }
  }
  g.clearing = false;
  g.clearRows = [];
  afterSettle(g, ctx);
  g.dirty = true;
}

export function lockPiece(g: GameState, ctx: EngineContext, now: number): void {
  if (!g.active) return;
  emit(ctx, { type: "lockStart" });
  const piece = g.active;
  if (SHAPES[piece.type][piece.rot].some(([, r]) => piece.y + r < 0)) {
    topOut(g, ctx);
    return;
  }
  emit(ctx, { type: "locked", piece: { ...piece } });
  g.board = merge(piece, g.board);
  g.pieces += 1;
  const full: number[] = [];
  g.board.forEach((row, y) => {
    if (row.every((c) => c)) full.push(y);
  });
  if (full.length) {
    g.clearing = true;
    g.clearRows = full;
    g.clearUntil = now + CLEAR_ANIM_MS;
    emit(ctx, { type: "clearStart", rows: full });
  } else {
    g.combo = 0;
    afterSettle(g, ctx);
  }
  g.dirty = true;
}

export function gravityStep(g: GameState): void {
  if (!g.active) return;
  const np = { ...g.active, y: g.active.y + 1 };
  if (valid(np, g.board)) {
    g.active = np;
    if (g.softDrop) g.score += 1;
    g.grounded = false;
    g.lockTimer = 0;
    g.dirty = true;
  } else {
    g.grounded = true;
  }
}

const canAct = (g: GameState): boolean => g.status === "playing" && !g.clearing && g.active != null;

export function move(g: GameState, ctx: EngineContext, dx: number): boolean {
  if (!canAct(g)) return false;
  const np = { ...g.active!, x: g.active!.x + dx };
  if (!valid(np, g.board)) return false;
  g.active = np;
  updateGrounded(g);
  resetLock(g);
  emit(ctx, { type: "moved" });
  g.dirty = true;
  return true;
}

export function rotate(g: GameState, ctx: EngineContext, dir: number): boolean {
  if (!canAct(g)) return false;
  const active = g.active!;
  const nr = (active.rot + dir + 4) % 4;
  for (const [dx, dy] of KICKS) {
    const np: Piece = { type: active.type, rot: nr, x: active.x + dx, y: active.y + dy };
    if (valid(np, g.board)) {
      g.active = np;
      updateGrounded(g);
      resetLock(g);
      emit(ctx, { type: "rotated" });
      g.dirty = true;
      return true;
    }
  }
  return false;
}

export function hardDrop(g: GameState, ctx: EngineContext, now: number): void {
  if (!canAct(g)) return;
  let n = 0;
  while (valid({ ...g.active!, y: g.active!.y + 1 }, g.board)) {
    g.active = { ...g.active!, y: g.active!.y + 1 };
    n++;
  }
  g.score += scoreValue(ctx, n * 2);
  emit(ctx, { type: "hardDropped", rows: n });
  lockPiece(g, ctx, now);
}

/** 往下一格（拖曳往下、輕鬆模式點一下 ↓）；回傳是否有移動。 */
export function softStep(g: GameState): boolean {
  if (!canAct(g)) return false;
  const np = { ...g.active!, y: g.active!.y + 1 };
  if (!valid(np, g.board)) return false;
  g.active = np;
  g.score += 1;
  g.dropAcc = 0;
  updateGrounded(g);
  g.dirty = true;
  return true;
}

export function holdPiece(g: GameState, ctx: EngineContext): boolean {
  if (!canAct(g) || !g.canHold || !ctx.config.holdEnabled) return false;
  const cur = g.active!.type;
  if (g.hold == null) {
    g.hold = cur;
    spawnNext(g, ctx);
  } else {
    const h = g.hold;
    g.hold = cur;
    g.active = { type: h, rot: 0, x: spawnX(boardCols(g.board)), y: 0 };
    if (!valid(g.active, g.board)) {
      topOut(g, ctx);
    } else {
      updateGrounded(g);
    }
  }
  g.canHold = false;
  g.lockTimer = 0;
  g.dirty = true;
  emit(ctx, { type: "held" });
  return true;
}

/** 開新局：狀態設為 playing、補 bag、生成第一塊。 */
export function beginGame(g: GameState, ctx: EngineContext): void {
  g.status = "playing";
  refill(g, ctx);
  spawnNext(g, ctx);
  g.lastTime = null;
}

/**
 * 每幀推進：消排動畫結束就結算；否則累積重力與鎖定計時。
 * `frozen`（測試掛鉤）時只推進消排動畫。
 */
export function tick(g: GameState, ctx: EngineContext, dt: number, now: number, frozen = false): void {
  if (g.status !== "playing") return;
  if (g.clearing) {
    if (now >= g.clearUntil) finishClear(g, ctx);
    return;
  }
  if (!g.active || frozen) return;
  const { config } = ctx;
  if (config.autoFall || g.softDrop) {
    const interval = config.gravityInterval(g.level, g.softDrop);
    g.dropAcc += dt;
    while (!g.clearing && g.dropAcc >= interval) {
      g.dropAcc -= interval;
      gravityStep(g);
    }
  }
  if (g.grounded) {
    g.lockTimer += dt;
    if (g.lockTimer >= config.lockDelayMs) lockPiece(g, ctx, now);
  }
}
