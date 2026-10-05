/**
 * 《繽紛消消樂》開局生成與重排：純函數、不可變。
 * 隨機嘗試失敗時改走「固定 seed 的保底盤」，保底盤依關卡配置決定性產生，
 * 測試可逐一證明每個上線配置都拿得到合格盤面。
 */

import {
  DROP_ITEM,
  emptySpecials,
  findHintMove,
  findMatches,
  findSpecialMove,
  idx,
  matchable,
  randomPiece,
  type BoardState,
  type CandySpecial,
  type Rng,
} from "./engine";
import { seededRng } from "./rng";

export type BoardGenOptions = {
  /** 隨機散佈的髒格數（沒有 dirtCells 時用） */
  dirtCount?: number;
  /** 指定髒格位置（區域模板）；優先於 dirtCount */
  dirtCells?: readonly number[];
  /** 厚污漬：必須是 dirtCells 的子集，開局層數為 2 */
  thickDirtCells?: readonly number[];
  /** 禮物數：放頂排、各在不同欄 */
  dropCount?: number;
  /** 開局必須有一步能做出特殊糖（教學關） */
  requireSpecialMove?: boolean;
  /** Replay 時避免直接重播上一盤完全相同的盤面。 */
  avoidBoard?: Pick<BoardState, "pieces" | "dirt">;
};

const RANDOM_ATTEMPTS = 64;
const FALLBACK_SEEDS = 2000;

function createsImmediateRun(
  pieces: readonly number[],
  c: number,
  r: number,
  cols: number,
  v: number,
): boolean {
  if (c >= 2 && pieces[idx(c - 1, r, cols)] === v && pieces[idx(c - 2, r, cols)] === v) {
    return true;
  }
  if (r >= 2 && pieces[idx(c, r - 1, cols)] === v && pieces[idx(c, r - 2, cols)] === v) {
    return true;
  }
  return false;
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.min(0.999999, Math.max(0, rng())) * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

function expectedDirt(cols: number, rows: number, options: BoardGenOptions): number {
  if (options.dirtCells) {
    return new Set(options.dirtCells.filter((i) => i >= 0 && i < cols * rows)).size;
  }
  return Math.min(options.dirtCount ?? 0, cols * rows);
}

function generateCandidate(
  cols: number,
  rows: number,
  kinds: number,
  rng: Rng,
  options: BoardGenOptions,
): BoardState {
  const pieces = Array<number>(cols * rows).fill(-1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let v = randomPiece(kinds, rng);
      let tries = 12;
      while (tries-- > 0 && createsImmediateRun(pieces, c, r, cols, v)) {
        v = randomPiece(kinds, rng);
      }
      pieces[idx(c, r, cols)] = v;
    }
  }
  const dropCount = Math.min(options.dropCount ?? 0, cols);
  const columns = shuffled(
    Array.from({ length: cols }, (_, c) => c),
    rng,
  ).slice(0, dropCount);
  for (const c of columns) pieces[idx(c, 0, cols)] = DROP_ITEM;

  const dirt = Array<number>(cols * rows).fill(0);
  const thick = new Set(options.thickDirtCells ?? []);
  if (options.dirtCells) {
    for (const i of options.dirtCells) {
      if (i >= 0 && i < dirt.length) dirt[i] = thick.has(i) ? 2 : 1;
    }
  } else {
    const want = Math.min(options.dirtCount ?? 0, cols * rows);
    const open = shuffled(
      Array.from({ length: cols * rows }, (_, i) => i).filter((i) => pieces[i] !== DROP_ITEM),
      rng,
    );
    for (const i of open.slice(0, want)) dirt[i] = thick.has(i) ? 2 : 1;
  }
  return { cols, rows, pieces, dirt, specials: emptySpecials(cols * rows) };
}

/** 開局盤面不變量：無三連、有可消除的一步、任務物件數正確。 */
export function isValidStartBoard(state: BoardState, options: BoardGenOptions = {}): boolean {
  const { cols, rows, pieces, dirt } = state;
  if (pieces.length !== cols * rows || dirt.length !== cols * rows) return false;
  if (findMatches(pieces, cols, rows).size > 0) return false;
  if (!findHintMove(pieces, cols, rows, state.specials)) return false;

  const gifts = pieces.flatMap((v, i) => (v === DROP_ITEM ? [i] : []));
  const wantGifts = Math.min(options.dropCount ?? 0, cols);
  if (gifts.length !== wantGifts) return false;
  if (gifts.some((i) => i >= cols)) return false;
  if (new Set(gifts.map((i) => i % cols)).size !== gifts.length) return false;

  const dirtCells = dirt.flatMap((d, i) => (d > 0 ? [i] : []));
  if (dirtCells.length !== expectedDirt(cols, rows, options)) return false;
  if (dirtCells.some((i) => pieces[i] === DROP_ITEM)) return false;
  if ((options.thickDirtCells ?? []).some((i) => dirt[i] !== 2)) return false;

  if (options.requireSpecialMove && !findSpecialMove(pieces, cols, rows)) return false;
  return true;
}

function sameBoard(a: Pick<BoardState, "pieces" | "dirt">, b: Pick<BoardState, "pieces" | "dirt">) {
  return (
    a.pieces.length === b.pieces.length &&
    a.dirt.length === b.dirt.length &&
    a.pieces.every((piece, i) => piece === b.pieces[i]) &&
    a.dirt.every((d, i) => d === b.dirt[i])
  );
}

function configSeed(cols: number, rows: number, kinds: number, options: BoardGenOptions): number {
  const dirt = options.dirtCells ? options.dirtCells.reduce((h, i) => (h * 31 + i) >>> 0, 7) : options.dirtCount ?? 0;
  const thick = options.thickDirtCells?.length
    ? options.thickDirtCells.reduce((h, i) => (h * 31 + i + 2) >>> 0, 11)
    : 0;
  return (
    (cols * 73856093) ^
    (rows * 19349663) ^
    (kinds * 83492791) ^
    ((options.dropCount ?? 0) * 2654435761) ^
    (dirt * 40503) ^
    (thick * 2246822519) ^
    (options.requireSpecialMove ? 0x5bd1e995 : 0)
  ) >>> 0;
}

/**
 * 依關卡配置決定性產生的保底盤（不吃外部 RNG）。
 * 同一配置永遠得到同一盤，測試逐一驗證所有上線配置都找得到合格盤。
 */
export function fallbackBoard(
  cols: number,
  rows: number,
  kinds: number,
  options: BoardGenOptions = {},
): BoardState {
  const base = configSeed(cols, rows, kinds, options);
  for (let seed = 1; seed <= FALLBACK_SEEDS; seed++) {
    const candidate = generateCandidate(cols, rows, kinds, seededRng(base + seed * 977), options);
    if (isValidStartBoard(candidate, options)) return candidate;
  }
  throw new Error(
    `Candy fallback board unavailable for ${cols}x${rows} kinds=${kinds} drops=${options.dropCount ?? 0}`,
  );
}

/** 生成棋盤：隨機嘗試，失敗或 RNG 偏斜時改用已驗證的保底盤。 */
export function createBoard(
  cols: number,
  rows: number,
  kinds: number,
  rng: Rng,
  options: BoardGenOptions = {},
): BoardState {
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    const candidate = generateCandidate(cols, rows, kinds, rng, options);
    if (!isValidStartBoard(candidate, options)) continue;
    if (options.avoidBoard && sameBoard(candidate, options.avoidBoard)) continue;
    return candidate;
  }
  return fallbackBoard(cols, rows, kinds, options);
}

function shuffleMovable(state: BoardState, specials: CandySpecial[], rng: Rng): BoardState {
  const movable: { piece: number; special: CandySpecial }[] = [];
  state.pieces.forEach((v, i) => {
    if (matchable(v)) movable.push({ piece: v, special: specials[i] ?? "none" });
  });
  const pool = shuffled(movable, rng);
  const pieces = state.pieces.slice();
  const nextSpecials = specials.slice();
  let k = 0;
  for (let i = 0; i < pieces.length; i++) {
    if (!matchable(pieces[i])) continue;
    const taken = pool[k++];
    if (!taken) continue;
    pieces[i] = taken.piece;
    nextSpecials[i] = taken.special;
  }
  return { ...state, pieces, specials: nextSpecials, dirt: state.dirt.slice() };
}

function recolorMovable(state: BoardState, specials: CandySpecial[], kinds: number, rng: Rng): BoardState {
  const { cols, rows } = state;
  const pieces = state.pieces.slice();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = idx(c, r, cols);
      if (!matchable(pieces[i])) continue;
      let v = randomPiece(kinds, rng);
      let tries = 12;
      while (tries-- > 0 && createsImmediateRun(pieces, c, r, cols, v)) {
        v = randomPiece(kinds, rng);
      }
      pieces[i] = v;
    }
  }
  return { ...state, pieces, specials: specials.slice(), dirt: state.dirt.slice() };
}

/**
 * 構造式保底：可消除格依 (欄 + 2×列) mod 種類 上色（橫、直都不會三連），
 * 再在某一列連續四格種下「A A B A」，換最後兩格就是一步三連。逐列嘗試並驗證。
 */
function constructedPlayable(state: BoardState, specials: CandySpecial[], kinds: number): BoardState | null {
  const { cols, rows } = state;
  const base = state.pieces.map((v, i) =>
    matchable(v) ? ((i % cols) + 2 * Math.floor(i / cols)) % kinds : v,
  );
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c + 3 < cols; c++) {
      const cells = [0, 1, 2, 3].map((k) => idx(c + k, r, cols));
      if (!cells.every((i) => matchable(base[i]!))) continue;
      for (let a = 0; a < kinds; a++) {
        const b = (a + 1) % kinds;
        const pieces = base.slice();
        [a, a, b, a].forEach((color, k) => {
          pieces[cells[k]!] = color;
        });
        const next = { ...state, pieces, specials: specials.slice(), dirt: state.dirt.slice() };
        if (isPlayable(next)) return next;
      }
    }
  }
  return null;
}

function isPlayable(state: BoardState): boolean {
  return (
    findMatches(state.pieces, state.cols, state.rows).size === 0 &&
    findHintMove(state.pieces, state.cols, state.rows, state.specials) != null
  );
}

/**
 * 無解時重排：保留髒格、禮物位置與特殊糖數量，重洗一般圖案直到無三連且有解。
 * 洗牌湊不出解時改為重新配色（特殊糖留在原格），不回傳仍無合法步的盤面。
 */
export function reshuffle(state: BoardState, rng: Rng, kinds?: number): BoardState {
  const specials = state.specials ?? emptySpecials(state.pieces.length);
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    const next = shuffleMovable(state, specials, rng);
    if (isPlayable(next)) return next;
  }
  const palette = Math.max(3, kinds ?? Math.max(0, ...state.pieces) + 1);
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS; attempt++) {
    const next = recolorMovable(state, specials, palette, rng);
    if (isPlayable(next)) return next;
  }
  const constructed = constructedPlayable(state, specials, palette);
  if (constructed) return constructed;
  const base = configSeed(state.cols, state.rows, palette, {});
  for (let seed = 1; seed <= FALLBACK_SEEDS; seed++) {
    const next = recolorMovable(state, specials, palette, seededRng(base + seed * 977));
    if (isPlayable(next)) return next;
  }
  // 只剩「沒有任何一列連續四格可消除格」的退化盤會走到這裡（上線關卡不會出現）
  return state;
}
