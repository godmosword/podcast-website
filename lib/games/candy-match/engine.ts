/**
 * 《繽紛消消樂》純函數引擎：棋盤生成、交換、三連判定、重力補格、連鎖、
 * 提示與重排。無 DOM 依賴，全部回傳新物件（不可變），可單元測試。
 */

export const EMPTY = -1;
/** 掉落物（禮物盒）：不可消除，會隨重力下落，到底排即送達。 */
export const DROP_ITEM = -2;

export type Rng = () => number;

/** 棋盤特殊糖：4 連掃把（消一排）、5 連彩虹（消同色）。 */
export type CandySpecial = "none" | "row" | "color";

export type SpecialSpawn = {
  index: number;
  kind: Exclude<CandySpecial, "none">;
};

export type BoardState = {
  cols: number;
  rows: number;
  /** 每格圖案索引（0..kinds-1）、EMPTY 或 DROP_ITEM */
  pieces: number[];
  /** 髒髒格（在其上完成消除即清潔） */
  dirt: boolean[];
  /** 與 pieces 等長；一般格為 none */
  specials: CandySpecial[];
};

export function emptySpecials(count: number): CandySpecial[] {
  return Array<CandySpecial>(count).fill("none");
}

export function swappedSpecials(
  specials: CandySpecial[],
  a: number,
  b: number,
): CandySpecial[] {
  const next = specials.slice();
  const tmp = next[a];
  next[a] = next[b];
  next[b] = tmp;
  return next;
}

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

export type CandyMatchRun = {
  cells: number[];
  length: number;
};

/** 橫向／直向 3+ 連線（不含斜線）。 */
export function findMatchRuns(
  pieces: number[],
  cols: number,
  rows: number,
): CandyMatchRun[] {
  const runs: CandyMatchRun[] = [];
  for (let r = 0; r < rows; r++) {
    let run = 1;
    for (let c = 1; c <= cols; c++) {
      const cur = c < cols ? pieces[idx(c, r, cols)] : EMPTY;
      const prev = pieces[idx(c - 1, r, cols)];
      if (c < cols && matchable(cur) && cur === prev) {
        run += 1;
      } else {
        if (run >= 3 && matchable(prev)) {
          const cells: number[] = [];
          for (let k = c - run; k < c; k++) cells.push(idx(k, r, cols));
          runs.push({ cells, length: run });
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
          const cells: number[] = [];
          for (let k = r - run; k < r; k++) cells.push(idx(c, k, cols));
          runs.push({ cells, length: run });
        }
        run = 1;
      }
    }
  }
  return runs;
}

/** 找出所有橫向／直向 3+ 連線的格子索引（不含斜線）。 */
export function findMatches(pieces: number[], cols: number, rows: number): Set<number> {
  const out = new Set<number>();
  for (const run of findMatchRuns(pieces, cols, rows)) {
    for (const i of run.cells) out.add(i);
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

/** 找一步可消除的交換（提示用）；無解回傳 null。特殊糖可與鄰格交換啟動。 */
export function findHintMove(
  pieces: number[],
  cols: number,
  rows: number,
  specials: CandySpecial[] = emptySpecials(pieces.length),
): { a: number; b: number } | null {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = idx(c, r, cols);
      if (c + 1 < cols) {
        const b = a + 1;
        if (swapIsLegal(pieces, specials, a, b, cols, rows)) return { a, b };
      }
      if (r + 1 < rows) {
        const b = a + cols;
        if (swapIsLegal(pieces, specials, a, b, cols, rows)) return { a, b };
      }
    }
  }
  return null;
}

/** 特殊糖與可消除鄰格交換即合法（不必先湊三連）。 */
export function swapIsLegal(
  pieces: number[],
  specials: CandySpecial[],
  a: number,
  b: number,
  cols: number,
  rows: number,
): boolean {
  if (!areAdjacent(a, b, cols)) return false;
  const aOk = matchable(pieces[a]);
  const bOk = matchable(pieces[b]);
  if (aOk && bOk && (specials[a] !== "none" || specials[b] !== "none")) {
    return true;
  }
  return swapCreatesMatch(pieces, a, b, cols, rows);
}

export function planSpecialSpawns(
  pieces: number[],
  cols: number,
  rows: number,
  preferCells: readonly number[] = [],
): SpecialSpawn[] {
  const runs = findMatchRuns(pieces, cols, rows).filter((run) => run.length >= 4);
  const spawns: SpecialSpawn[] = [];
  const used = new Set<number>();
  for (const run of runs) {
    const kind: Exclude<CandySpecial, "none"> = run.length >= 5 ? "color" : "row";
    const preferred = preferCells.find((cell) => run.cells.includes(cell) && !used.has(cell));
    const fallback = run.cells.find((cell) => !used.has(cell));
    const index = preferred ?? fallback;
    if (index == null) continue;
    used.add(index);
    const existing = spawns.find((spawn) => spawn.index === index);
    if (existing) {
      if (kind === "color") existing.kind = "color";
    } else {
      spawns.push({ index, kind });
    }
  }
  return spawns;
}

export function cellsClearedBySpecial(
  pieces: number[],
  specials: CandySpecial[],
  origin: number,
  cols: number,
): number[] {
  const kind = specials[origin];
  if (kind === "none") return [];
  const out: number[] = [];
  if (kind === "row") {
    const row = Math.floor(origin / cols);
    for (let c = 0; c < cols; c++) {
      const i = idx(c, row, cols);
      if (pieces[i] >= 0) out.push(i);
    }
    return out;
  }
  const color = pieces[origin];
  if (color < 0) return out;
  pieces.forEach((piece, i) => {
    if (piece === color) out.push(i);
  });
  return out;
}

export function expandClearsWithSpecials(
  pieces: number[],
  specials: CandySpecial[],
  initial: Iterable<number>,
  cols: number,
): Set<number> {
  const rank = (i: number): number =>
    specials[i] === "row" ? 0 : specials[i] === "color" ? 1 : 2;
  const out = new Set(initial);
  const queue = [...out];
  while (queue.length > 0) {
    queue.sort((a, b) => rank(a) - rank(b));
    const i = queue.shift();
    if (i == null || specials[i] === "none") continue;
    for (const j of cellsClearedBySpecial(pieces, specials, i, cols)) {
      if (!out.has(j)) {
        out.add(j);
        queue.push(j);
      }
    }
  }
  return out;
}

export function planWaveClears(
  pieces: number[],
  specials: CandySpecial[],
  cols: number,
  rows: number,
  extraCells?: Iterable<number>,
  preferSpawnAt: readonly number[] = [],
  extraOnly = false,
): {
  clear: Set<number>;
  spawns: SpecialSpawn[];
  detonated: Array<Exclude<CandySpecial, "none">>;
} {
  const matches = extraOnly ? new Set<number>() : findMatches(pieces, cols, rows);
  const initial = new Set(matches);
  if (extraCells) {
    for (const i of extraCells) initial.add(i);
  }
  if (initial.size === 0) {
    return { clear: new Set(), spawns: [], detonated: [] };
  }
  const clear = expandClearsWithSpecials(pieces, specials, initial, cols);
  const detonated: Array<Exclude<CandySpecial, "none">> = [];
  for (const i of clear) {
    if (specials[i] === "row" || specials[i] === "color") detonated.push(specials[i]);
  }
  detonated.sort((a, b) => (a === "row" && b === "color" ? -1 : a === "color" && b === "row" ? 1 : 0));
  const spawns = extraOnly
    ? []
    : planSpecialSpawns(pieces, cols, rows, preferSpawnAt).filter((spawn) => {
        if (!matches.has(spawn.index)) return false;
        if (specials[spawn.index] !== "none") return false;
        return true;
      });
  for (const spawn of spawns) clear.delete(spawn.index);
  return { clear, spawns, detonated };
}

export function applySpecialSpawns(
  specials: CandySpecial[],
  spawns: SpecialSpawn[],
): CandySpecial[] {
  const next = specials.slice();
  for (const spawn of spawns) next[spawn.index] = spawn.kind;
  return next;
}

function randomPiece(kinds: number, rng: Rng): number {
  return Math.floor(rng() * kinds);
}

/** 交換位移動畫時長（ms）。減少動態時應跳過。 */
export const CANDY_SWAP_MS = 180;
/** 重力掉落動畫時長（ms）。 */
export const CANDY_FALL_MS = 220;
/** 消除 pop 動畫時長（ms）。 */
export const CANDY_POP_MS = 280;
/** 特殊糖掃過動畫時長（ms）。減少動態時應跳過。 */
export const CANDY_SWEEP_MS = 280;

/** 單格重力位移：目的地格子與往下掉幾列。 */
export type CandyFallMotion = {
  to: number;
  rows: number;
};

/**
 * 在套用重力前，計算各格會掉幾列（含頂部新補進來的圖案）。
 * 給 UI 用 transform 播掉落；不改 pieces。
 */
export function planGravity(
  pieces: number[],
  cols: number,
  rows: number,
): CandyFallMotion[] {
  const moves: CandyFallMotion[] = [];
  for (let c = 0; c < cols; c++) {
    const surviving: number[] = [];
    for (let r = 0; r < rows; r++) {
      const i = idx(c, r, cols);
      if (pieces[i] !== EMPTY) surviving.push(i);
    }
    const emptyCount = rows - surviving.length;
    if (emptyCount === 0) continue;
    surviving.forEach((from, k) => {
      const destRow = emptyCount + k;
      const fromRow = Math.floor(from / cols);
      const fallRows = destRow - fromRow;
      if (fallRows > 0) {
        moves.push({ to: idx(c, destRow, cols), rows: fallRows });
      }
    });
    for (let destRow = 0; destRow < emptyCount; destRow++) {
      moves.push({ to: idx(c, destRow, cols), rows: emptyCount });
    }
  }
  return moves;
}

/** 重力：各欄往下壓實，頂部補新圖案（掉落物與特殊糖一起下落）。 */
export function applyGravity(
  pieces: number[],
  cols: number,
  rows: number,
  kinds: number,
  rng: Rng,
  specials: readonly CandySpecial[] = emptySpecials(pieces.length),
): { pieces: number[]; specials: CandySpecial[] } {
  const prevSpecials =
    specials.length === pieces.length ? specials.slice() : emptySpecials(pieces.length);
  const next = pieces.slice();
  const nextSpecials = prevSpecials.slice();
  for (let c = 0; c < cols; c++) {
    let write = rows - 1;
    for (let r = rows - 1; r >= 0; r--) {
      const i = idx(c, r, cols);
      if (next[i] !== EMPTY) {
        next[idx(c, write, cols)] = next[i];
        nextSpecials[idx(c, write, cols)] = nextSpecials[i];
        write -= 1;
      }
    }
    for (let r = write; r >= 0; r--) {
      const i = idx(c, r, cols);
      next[i] = randomPiece(kinds, rng);
      nextSpecials[i] = "none";
    }
  }
  return { pieces: next, specials: nextSpecials };
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
  let dirt = state.dirt.slice();
  let specials = (state.specials ?? emptySpecials(pieces.length)).slice();
  const events: ResolveEvents = {
    collected: Array<number>(kinds).fill(0),
    cleaned: 0,
    dropped: 0,
    waves: 0,
    clearedByWave: [],
  };

  // 掉落物可能已在底排（例如交換直接送到底）
  const collectDrops = () => {
    const collected = collectBottomDrops(pieces, cols, rows, specials);
    pieces = collected.pieces;
    specials = collected.specials;
    events.dropped += collected.dropped;
  };

  let guard = 32;
  while (guard-- > 0) {
    collectDrops();
    if (pieces.includes(EMPTY)) {
      const fallen = applyGravity(pieces, cols, rows, kinds, rng, specials);
      pieces = fallen.pieces;
      specials = fallen.specials;
      continue;
    }
    const wave = planWaveClears(pieces, specials, cols, rows);
    if (wave.clear.size === 0) break;
    events.waves += 1;
    events.clearedByWave.push([...wave.clear]);
    const cleared = clearCells(pieces, dirt, wave.clear, kinds, specials);
    pieces = cleared.pieces;
    dirt = cleared.dirt;
    specials = applySpecialSpawns(cleared.specials, wave.spawns);
    events.collected.forEach((_, i) => {
      events.collected[i] += cleared.collected[i] ?? 0;
    });
    events.cleaned += cleared.cleaned;
    const fallen = applyGravity(pieces, cols, rows, kinds, rng, specials);
    pieces = fallen.pieces;
    specials = fallen.specials;
  }
  collectDrops();

  return { state: { cols, rows, pieces, dirt, specials }, events };
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
  specials: CandySpecial[] = emptySpecials(pieces.length),
): {
  pieces: number[];
  dirt: boolean[];
  specials: CandySpecial[];
  collected: number[];
  cleaned: number;
} {
  const nextPieces = pieces.slice();
  const nextDirt = dirt.slice();
  const nextSpecials = specials.slice();
  const collected = Array<number>(kinds).fill(0);
  let cleaned = 0;
  for (const i of cells) {
    const v = nextPieces[i];
    if (v >= 0) collected[v] += 1;
    if (v !== DROP_ITEM) nextPieces[i] = EMPTY;
    nextSpecials[i] = "none";
    if (nextDirt[i]) {
      nextDirt[i] = false;
      cleaned += 1;
    }
  }
  return { pieces: nextPieces, dirt: nextDirt, specials: nextSpecials, collected, cleaned };
}

/** 底排掉落物送達：回傳新 pieces 與送達數。 */
export function collectBottomDrops(
  pieces: number[],
  cols: number,
  rows: number,
  specials: CandySpecial[] = emptySpecials(pieces.length),
): { pieces: number[]; specials: CandySpecial[]; dropped: number } {
  const next = pieces.slice();
  const nextSpecials = specials.slice();
  let dropped = 0;
  for (let c = 0; c < cols; c++) {
    const bottom = idx(c, rows - 1, cols);
    if (next[bottom] === DROP_ITEM) {
      next[bottom] = EMPTY;
      nextSpecials[bottom] = "none";
      dropped += 1;
    }
  }
  return { pieces: next, specials: nextSpecials, dropped };
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
    return { cols, rows, pieces, dirt, specials: emptySpecials(cols * rows) };
  }
  // 理論上不會到這；保底回傳最後一次生成（仍可玩，靠重排修復）
  const pieces = Array.from({ length: cols * rows }, () => randomPiece(kinds, rng));
  return {
    cols,
    rows,
    pieces,
    dirt: Array<boolean>(cols * rows).fill(false),
    specials: emptySpecials(cols * rows),
  };
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
  const specials = state.specials ?? emptySpecials(state.pieces.length);
  const movable: { piece: number; special: CandySpecial }[] = [];
  state.pieces.forEach((v, i) => {
    if (matchable(v)) movable.push({ piece: v, special: specials[i] ?? "none" });
  });
  let guard = 64;
  while (guard-- > 0) {
    const pool = movable.slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = pool[i];
      pool[i] = pool[j];
      pool[j] = t;
    }
    const pieces = state.pieces.slice();
    const nextSpecials = specials.slice();
    for (let i = 0; i < pieces.length; i++) {
      if (!matchable(pieces[i])) continue;
      const taken = pool.pop();
      if (!taken) continue;
      pieces[i] = taken.piece;
      nextSpecials[i] = taken.special;
    }
    if (findMatches(pieces, cols, rows).size > 0) continue;
    if (!findHintMove(pieces, cols, rows, nextSpecials)) continue;
    return { ...state, pieces, specials: nextSpecials, dirt: state.dirt.slice() };
  }
  return state;
}
