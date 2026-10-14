/**
 * 車車消消樂消除特效的純描述：掃把車車、三角錐、彩虹、連鎖稱讚、粒子預算。
 * 不改消除規則，也不碰 DOM。畫面與聲音照這份結果播。
 */
import type { CandyComboKind, CandySpecial } from "@/lib/games/candy-match/engine";
import { CANDY_MATCH_PIECES } from "@/lib/games/candy-match/levels";

/** 連鎖或特殊組合的稱讚，一步比一步大聲。第 4 步起停在最後一句。 */
export const PRAISE_LINES = ["好棒", "超級棒", "太厲害了"] as const;

/** 普通三連的停留，與引擎 CANDY_POP_MS 相同，不另外拖慢。 */
export const MATCH_FX_MS = 280;
/** 掃把：車車開過整排，比普通消除多停一點點，讓車開得完。 */
export const LINE_FX_MS = 420;
/** 爆炸糖：三角錐與衝擊波。 */
export const BURST_FX_MS = 380;
/** 彩虹：光掃到同色車。仍短於 600ms。 */
export const COLOR_FX_MS = 480;
/** 大組合輕晃。不到 200ms、只有幾像素。 */
export const SHAKE_MS = 180;
export const SHAKE_PX = 3;
/** 減少動態時，高亮停留，不位移。 */
export const FX_STILL_MS = 160;

export const PARTICLE_MS = 350;
export const PARTICLES_PER_CELL = 4;
/** 低階手機上限：整波最多這麼多顆。 */
export const PARTICLE_CAP = 60;

export const PRAISE_MS = 900;
export const CONFETTI_MS = 1200;
export const CONFETTI_COUNT = 12;

/** 同時最多幾台車、幾顆錐、幾道彩虹，避免連鎖時 DOM 堆太多。 */
export const MAX_LINE_FX = 4;
export const MAX_BURST_FX = 2;
export const MAX_COLOR_FX = 2;
export const MAX_COLOR_BEAMS = 24;

/**
 * 喇叭「叭叭」：兩個方波，很短，音量低於語音。
 * 實際出聲走既有 tone()，靜音時由音效匯流排直接略過。
 */
export const HORN_NOTES = [
  { freq: 494, dur: 0.07, type: "square" as const, vol: 0.032, at: 0 },
  { freq: 622, dur: 0.09, type: "square" as const, vol: 0.028, at: 90 },
] as const;

const CONFETTI_COLORS = CANDY_MATCH_PIECES.map((piece) => piece.color);

export type LineFx = { kind: "line"; axis: "row" | "col"; index: number; piece?: number };
export type BurstFx = { kind: "burst"; origin: number };
export type ColorFx = { kind: "color"; origin: number; cells: number[] };
export type ClearFx = LineFx | BurstFx | ColorFx;

export type ParticleSeed = { cell: number; color: string };

export type CandyFxPraise = {
  id: number;
  text: string;
  step: number;
  confetti: boolean;
};

export type ConfettiPiece = { left: number; color: string; delayMs: number };

export function praiseLine(step: number): (typeof PRAISE_LINES)[number] | null {
  if (step < 1) return null;
  const index = Math.min(step, PRAISE_LINES.length) - 1;
  return PRAISE_LINES[index] ?? null;
}

/** 這一排（或這一欄）被清掉的第一台車負責開過去，新車也會自己開。 */
function pieceOnLine(
  pieces: readonly number[],
  cols: number,
  rows: number,
  axis: "row" | "col",
  index: number,
  cleared: ReadonlySet<number>,
): number {
  const span = axis === "row" ? cols : rows;
  for (let k = 0; k < span; k++) {
    const i = axis === "row" ? index * cols + k : k * cols + index;
    if (!cleared.has(i)) continue;
    const piece = pieces[i] ?? -1;
    if (piece >= 0) return piece;
  }
  return 0;
}

function dedupeLines(lines: readonly LineFx[]): LineFx[] {
  const seen = new Set<string>();
  const out: LineFx[] = [];
  for (const line of lines) {
    const key = `${line.axis}:${line.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out.slice(0, MAX_LINE_FX);
}

/** 整排（或整欄）可消除的車都被清掉，而且至少 4 格：道具掃把，或沒標成特殊糖的整線。 */
function fullLines(
  pieces: readonly number[],
  cols: number,
  rows: number,
  cleared: ReadonlySet<number>,
): LineFx[] {
  const lines: LineFx[] = [];
  for (let r = 0; r < rows; r++) {
    let matchable = 0;
    let hit = 0;
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if ((pieces[i] ?? -1) < 0) continue;
      matchable += 1;
      if (cleared.has(i)) hit += 1;
    }
    if (matchable >= 4 && hit === matchable) lines.push({ kind: "line", axis: "row", index: r });
  }
  for (let c = 0; c < cols; c++) {
    let matchable = 0;
    let hit = 0;
    for (let r = 0; r < rows; r++) {
      const i = r * cols + c;
      if ((pieces[i] ?? -1) < 0) continue;
      matchable += 1;
      if (cleared.has(i)) hit += 1;
    }
    if (matchable >= 4 && hit === matchable) lines.push({ kind: "line", axis: "col", index: c });
  }
  return lines;
}

/** 道具彩虹：同一色在盤上的車全部清掉，而且至少 4 台。三連不會進這裡。 */
function propRainbow(
  pieces: readonly number[],
  cleared: readonly number[],
  clearSet: ReadonlySet<number>,
): ColorFx | null {
  if (cleared.length < 4) return null;
  const colors = new Set<number>();
  for (const i of cleared) {
    const color = pieces[i] ?? -1;
    if (color >= 0) colors.add(color);
  }
  if (colors.size !== 1) return null;
  const color = [...colors][0]!;
  let onBoard = 0;
  for (let i = 0; i < pieces.length; i++) {
    if (pieces[i] !== color) continue;
    onBoard += 1;
    if (!clearSet.has(i)) return null;
  }
  if (onBoard < 4) return null;
  return { kind: "color", origin: cleared[0] ?? 0, cells: [...cleared] };
}

/**
 * 這一波要播哪些特效。combo／becomeRow 來自引擎，不重新判斷消除。
 * 掃把走橫排；十字再加直欄。普通三連不產生線。
 */
export function planClearFx(input: {
  pieces: readonly number[];
  specials: readonly CandySpecial[];
  cols: number;
  rows: number;
  cleared: readonly number[];
  combo?: CandyComboKind | null;
  becomeRow?: readonly number[];
}): ClearFx[] {
  const { pieces, specials, cols, rows, cleared } = input;
  const combo = input.combo ?? null;
  const clearSet = new Set(cleared);
  const lines: LineFx[] = [];
  const bursts: BurstFx[] = [];
  const colors: ColorFx[] = [];

  if (combo === "clear-board") {
    const origin = cleared.find((i) => specials[i] === "color") ?? cleared[0] ?? 0;
    return [{ kind: "color", origin, cells: [...cleared] }];
  }

  if (combo === "cross") {
    const brooms = cleared.filter((i) => specials[i] === "row");
    const anchors = brooms.length > 0 ? brooms : cleared.slice(0, 2);
    for (const i of anchors) {
      lines.push({ kind: "line", axis: "row", index: Math.floor(i / cols) });
      lines.push({ kind: "line", axis: "col", index: i % cols });
    }
  }

  for (const i of cleared) {
    const kind = specials[i];
    if (kind === "burst") {
      bursts.push({ kind: "burst", origin: i });
    } else if (kind === "color") {
      const color = pieces[i] ?? -1;
      const cells = cleared.filter((j) => pieces[j] === color);
      colors.push({ kind: "color", origin: i, cells });
    } else if (kind === "row" && combo !== "cross") {
      lines.push({ kind: "line", axis: "row", index: Math.floor(i / cols) });
    }
  }

  if (combo === "color-brooms") {
    for (const i of input.becomeRow ?? []) {
      lines.push({ kind: "line", axis: "row", index: Math.floor(i / cols) });
    }
  }

  if (lines.length === 0) lines.push(...fullLines(pieces, cols, rows, clearSet));
  if (colors.length === 0 && lines.length === 0 && bursts.length === 0) {
    const rainbow = propRainbow(pieces, cleared, clearSet);
    if (rainbow) colors.push(rainbow);
  }

  return [
    ...dedupeLines(lines).map((line) => ({
      ...line,
      piece: pieceOnLine(pieces, cols, rows, line.axis, line.index, clearSet),
    })),
    ...bursts.slice(0, MAX_BURST_FX),
    ...colors.slice(0, MAX_COLOR_FX),
  ];
}

export function fxHoldMs(fx: readonly ClearFx[]): number {
  if (fx.some((item) => item.kind === "color")) return COLOR_FX_MS;
  if (fx.some((item) => item.kind === "line")) return LINE_FX_MS;
  if (fx.some((item) => item.kind === "burst")) return BURST_FX_MS;
  return MATCH_FX_MS;
}

/** 普通消除的小星星。特殊招式自己有演出，不再加粒子。減少動態時一顆都不生。 */
export function matchParticles(
  pieces: readonly number[],
  cleared: readonly number[],
  enabled: boolean,
): ParticleSeed[] {
  if (!enabled) return [];
  const seeds: ParticleSeed[] = [];
  for (const cell of cleared) {
    const piece = pieces[cell] ?? -1;
    if (piece < 0) continue;
    const color = CANDY_MATCH_PIECES[piece]?.color ?? "#ffd34d";
    seeds.push({ cell, color });
    if (seeds.length * PARTICLES_PER_CELL >= PARTICLE_CAP) break;
  }
  return seeds;
}

export function particleBudget(seedCount: number): number {
  if (seedCount <= 0) return 0;
  return Math.min(PARTICLE_CAP, seedCount * PARTICLES_PER_CELL);
}

export type WavePresentation = {
  praiseStep: number;
  praise: string | null;
  confetti: boolean;
  horn: boolean;
  shake: boolean;
  /** 減少動態：不晃、不撒粒子，改成靜態高亮。 */
  still: boolean;
  particles: ParticleSeed[];
  holdMs: number;
};

/**
 * 一波消除要給孩子看什麼、聽什麼。
 * 稱讚從特殊組合，或同一步的第 2 波連鎖開始，一步升一級。
 * 輕晃只在大組合（十字、清盤，或升到「太厲害了」），而且音效開著。
 */
export function presentWave(input: {
  waveIndex: number;
  previousPraiseStep: number;
  combo: CandyComboKind | null;
  reduced: boolean;
  soundOn: boolean;
  fx: readonly ClearFx[];
  pieces: readonly number[];
  cleared: readonly number[];
}): WavePresentation {
  const escalate = Boolean(input.combo) || input.waveIndex >= 2;
  const praiseStep = escalate ? input.previousPraiseStep + 1 : 0;
  const praise = escalate ? praiseLine(praiseStep) : null;
  const big = input.combo === "cross" || input.combo === "clear-board" || praiseStep >= 3;
  const hasSpecial = input.fx.length > 0;
  const still = input.reduced && (hasSpecial || big);
  return {
    praiseStep: escalate ? praiseStep : input.previousPraiseStep,
    praise,
    confetti: Boolean(praise) && !input.reduced,
    horn: Boolean(praise) && input.soundOn,
    shake: big && !input.reduced && input.soundOn,
    still,
    particles: matchParticles(input.pieces, input.cleared, !input.reduced && !hasSpecial),
    holdMs: input.reduced && still ? FX_STILL_MS : fxHoldMs(input.fx),
  };
}

/** 彩紙位置固定（不靠 Math.random），測試與每一步看起來穩定。 */
export function confettiPieces(step: number, count = CONFETTI_COUNT): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push({
      left: ((i * 37 + step * 13) % 88) + 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
      delayMs: (i % 4) * 50,
    });
  }
  return pieces;
}
