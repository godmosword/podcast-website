/**
 * 《繽紛消消樂》純函數引擎：棋盤生成、交換、三連判定、重力補格、連鎖、
 * 提示與重排。無 DOM 依賴，全部回傳新物件（不可變），可單元測試。
 */

export const EMPTY = -1;
/** 掉落物（禮物盒）：不可消除，會隨重力下落，到底排即送達。 */
export const DROP_ITEM = -2;

export type Rng = () => number;

export type BoardState = {
  cols: number;
  rows: number;
  /** 每格圖案索引（0..kinds-1）、EMPTY 或 DROP_ITEM */
  pieces: number[];
  /** 髒髒格（在其上完成消除即清潔） */
  dirt: boolean[];
};

export type ResolveEvents = {
  /** 各圖案被消除的數量 */
  collected: number[];
  /** 清潔的髒髒格數 */
  cleaned: number;
  /** 送達底部的掉落物數 */
  dropped: number;
  /** 消除波數（一次交換的連鎖各算一波） */
  waves: number;
  /** 每一波被消除的格子索引（供動畫用） */
  clearedByWave: number[][];
};

export const idx = (col: number, row: number, cols: number): number => row * cols + col;

export function areAdjacent(a: number, b: number, cols: number): boolean {
  const ac = a % cols;
  const ar = Math.floor(a / cols);
  const bc = b % cols;
  const br = Math.floor(b / cols);
  return Math.abs(ac - bc) + Math.abs(ar - br) === 1;
}

export function swapped(pieces: number[], a: number, b: number): number[] {
  const next = pieces.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

const matchable = (v: number): boolean => v >= 0;

/** 找出所有橫向／直向 3+ 連線的格子索引（不含斜線）。 */
export function findMatches(pieces: number[], cols: number, rows: number): Set<number> {
  const out = new Set<number>();
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c <= cols; c++) {
      const cur = c < cols ? pieces[idx(c, r, cols)] : EMPTY;
      const prev = pieces[idx(c - 1, r, cols)];
      if (c < cols && matchable(cur) && cur === prev) {
        run += 1;
      } else {
        if (run >= 3 && matchable(prev)) {
          for (let k = c - run; k < c; k++) out.add(idx(k, r, cols));
        }
        run = 1;
      }
    }
  }
  for (let c = 0; c < cols; c++) {
    let run = 1;
    for (let r = 1; r <= rows; r++) {
      const cur = r < rows ? pieces[idx(c, r, cols)] : EMPTY;
      const prev = pieces[idx(c, r - 1, cols)];
      if (r < rows && matchable(cur) && cur === prev) {
        run += 1;
      } else {
        if (run >= 3 && matchable(prev)) {
          for (let k = r - run; k < r; k++) out.add(idx(c, k, cols));
        }
        run = 1;
      }
    }
  }
  return out;
}

/** 交換 a/b 後是否會產生消除（合法步）。 */
export function swapCreatesMatch(
  pieces: number[],
  a: number,
  b: number,
  cols: number,
  rows: number,
): boolean {
  if (!areAdjacent(a, b, cols)) return false;
  if (!matchable(pieces[a]) || !matchable(pieces[b])) return false;
  return findMatches(swapped(pieces, a, b), cols, rows).size > 0;
}

/** 找一步可消除的交換（提示用）；無解回傳 null。 */
export function findHintMove(
  pieces: number[],
  cols: number,
  rows: number,
): { a: number; b: number } | null {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = idx(c, r, cols);
      if (c + 1 < cols) {
        const b = a + 1;
        if (swapCreatesMatch(pieces, a, b, cols, rows)) return { a, b };
      }
      if (r + 1 < rows) {
        const b = a + cols;
        if (swapCreatesMatch(pieces, a, b, cols, rows)) return { a, b };
      }
    }
  }
  return null;
}

function randomPiece(kinds: number, rng: Rng): number {
  return Math.floor(rng() * kinds);
}

/** 重力：各欄往下壓實，頂部補新圖案（掉落物一起下落）。 */
export function applyGravity(
  pieces: number[],
  cols: number,
  rows: number,
  kinds: number,
  rng: Rng,
): number[] {
  const next = pieces.slice();
  for (let c = 0; c < cols; c++) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      const v = next[idx(c, r, cols)];
      if (v !== EMPTY) {
        next[idx(c, write, cols)] = v;
        write -= 1;
      }
    }
    for (let r = write; r >= 0; r--) {
      next[idx(c, r, cols)] = randomPiece(kinds, rng);
    }
  }
  return next;
}

/**
 * 解算整個消除流程（消除 → 清髒 → 重力補格 → 掉落物送達 → 連鎖），
 * 直到穩定。回傳新狀態與事件統計。
 */
export function resolveBoard(
  state: BoardState,
  kinds: number,
  rng: Rng,
): { state: BoardState; events: ResolveEvents } {
  const { cols, rows } = state;
  let pieces = state.pieces.slice();
  const dirt = state.dirt.slice();
  const events: ResolveEvents = {
    collected: Array<number>(kinds).fill(0),
    cleaned: 0,
    dropped: 0,
    waves: 0,
    clearedByWave: [],
  };

  // 掉落物可能已在底排（例如交換直接送到底）
  const collectDrops = () => {
    for (let c = 0; c < cols; c++) {
      const bottom = idx(c, rows - 1, cols);
      if (pieces[bottom] === DROP_ITEM) {
        pieces[bottom] = EMPTY;
        events.dropped += 1;
      }
    }
  };

  let guard = 32;
  while (guard-- > 0) {
    collectDrops();
    if (pieces.includes(EMPTY)) {
      pieces = applyGravity(pieces, cols, rows, kinds, rng);
      continue;
    }
    const matches = findMatches(pieces, cols, rows);
    if (matches.size === 0) break;
    events.waves += 1;
    events.clearedByWave.push([...matches]);
    for (const i of matches) {
      const v = pieces[i];
      if (v >= 0) events.collected[v] += 1;
      pieces[i] = EMPTY;
      if (dirt[i]) {
        dirt[i] = false;
        events.cleaned += 1;
      }
    }
    pieces = applyGravity(pieces, cols, rows, kinds, rng);
  }
  collectDrops();

  return { state: { cols, rows, pieces, dirt }, events };
}

/**
 * 清除指定格（單波）：給 UI 逐波動畫用。
 * 回傳新 pieces/dirt 與該波統計（resolveBoard 的單步版本）。
 */
export function clearCells(
  pieces: number[],
  dirt: boolean[],
  cells: Iterable<number>,
  kinds: number,
): {
  pieces: number[];
  dirt: boolean[];
  collected: number[];
  cleaned: number;
} {
  const nextPieces = pieces.slice();
  const nextDirt = dirt.slice();
  const collected = Array<number>(kinds).fill(0);
  let cleaned = 0;
  for (const i of cells) {
    const v = nextPieces[i];
    if (v >= 0) collected[v] += 1;
    if (v !== DROP_ITEM) nextPieces[i] = EMPTY;
    if (nextDirt[i]) {
      nextDirt[i] = false;
      cleaned += 1;
    }
  }
  return { pieces: nextPieces, dirt: nextDirt, collected, cleaned };
}

/** 底排掉落物送達：回傳新 pieces 與送達數。 */
export function collectBottomDrops(
  pieces: number[],
  cols: number,
  rows: number,
): { pieces: number[]; dropped: number } {
  const next = pieces.slice();
  let dropped = 0;
  for (let c = 0; c < cols; c++) {
    const bottom = idx(c, rows - 1, cols);
    if (next[bottom] === DROP_ITEM) {
      next[bottom] = EMPTY;
      dropped += 1;
    }
  }
  return { pieces: next, dropped };
}

/** 生成棋盤：無初始三連、至少一步可解；髒髒格與掉落物依關卡配置。 */
export function createBoard(
  cols: number,
  rows: number,
  kinds: number,
  rng: Rng,
  options: { dirtCount?: number; dropCount?: number } = {},
): BoardState {
  let guard = 64;
  while (guard-- > 0) {
    const pieces = Array<number>(cols * rows).fill(EMPTY);
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
    // 掉落物放頂排（非消除物，覆蓋原圖案）
    const dropCount = options.dropCount ?? 0;
    for (let n = 0; n < dropCount; n++) {
      const c = Math.floor(rng() * cols);
      pieces[idx(c, 0, cols)] = DROP_ITEM;
    }
    if (findMatches(pieces, cols, rows).size > 0) continue;
    if (!findHintMove(pieces, cols, rows)) continue;

    const dirt = Array<boolean>(cols * rows).fill(false);
    const dirtCount = options.dirtCount ?? 0;
    let placed = 0;
    let dirtGuard = 200;
    while (placed < dirtCount && dirtGuard-- > 0) {
      const i = Math.floor(rng() * cols * rows);
      if (!dirt[i] && pieces[i] !== DROP_ITEM) {
        dirt[i] = true;
        placed += 1;
      }
    }
    return { cols, rows, pieces, dirt };
  }
  // 理論上不會到這；保底回傳最後一次生成（仍可玩，靠重排修復）
  const pieces = Array.from({ length: cols * rows }, () => randomPiece(kinds, rng));
  return { cols, rows, pieces, dirt: Array<boolean>(cols * rows).fill(false) };
}

function createsImmediateRun(
  pieces: number[],
  c: number,
  r: number,
  cols: number,
  v: number,
): boolean {
  if (
    c >= 2 &&
    pieces[idx(c - 1, r, cols)] === v &&
    pieces[idx(c - 2, r, cols)] === v
  ) {
    return true;
  }
  if (
    r >= 2 &&
    pieces[idx(c, r - 1, cols)] === v &&
    pieces[idx(c, r - 2, cols)] === v
  ) {
    return true;
  }
  return false;
}

/** 無解時重排：保留掉落物位置，重洗一般圖案直到無初始三連且有解。 */
export function reshuffle(state: BoardState, rng: Rng): BoardState {
  const { cols, rows } = state;
  const movable: number[] = [];
  for (const v of state.pieces) {
    if (matchable(v)) movable.push(v);
  }
  let guard = 64;
  while (guard-- > 0) {
    const pool = movable.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    const pieces = state.pieces.map((v) => (matchable(v) ? pool.pop()! : v));
    if (findMatches(pieces, cols, rows).size > 0) continue;
    if (!findHintMove(pieces, cols, rows)) continue;
    return { ...state, pieces, dirt: state.dirt.slice() };
  }
  return state;
}
