/**
 * 《繽紛消消樂》純函數引擎：棋盤生成、交換、三連判定、重力補格、連鎖、
 * 提示與重排。無 DOM 依賴，全部回傳新物件（不可變），可單元測試。
 */

export const EMPTY = -1;
/** 掉落物（禮物盒）：不可消除，會隨重力下落，到底排即送達。 */
export const DROP_ITEM = -2;

export type Rng = () => number;

/** 棋盤特殊糖：4 連掃把（消一排）、5 連彩虹（消同色）、L/T 爆炸糖（周圍 3×3）。 */
export type CandySpecial = "none" | "row" | "color" | "burst";

/** 兩顆特殊糖相換才有的組合。掃把＋爆炸糖仍走各自引爆，不另造一句新規則。 */
export type CandyComboKind = "cross" | "color-brooms" | "clear-board";

export type CandyCombo = {
  kind: CandyComboKind;
  /** 掃把＋彩虹：結算前先變成掃把的格子（不含彩虹那格）。 */
  becomeRow: number[];
};

/** 消除演出種類：特殊糖本身，或組合的十字／清盤。 */
export type CandySweepKind = Exclude<CandySpecial, "none"> | "cross" | "board";

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
  /** 實際引爆的棋盤特殊糖數（含連鎖引爆；工具列道具本身不算） */
  detonated: number;
  /** 本次解算新做出的特殊糖數 */
  specialsMade: number;
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

export const matchable = (v: number): boolean => v >= 0;

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

/** 禮物例外：禮物與正下方的可消除格交換，即使沒湊三連也合法（把禮物往下送）。 */
export function isGiftDropSwap(
  pieces: number[],
  a: number,
  b: number,
  cols: number,
): boolean {
  if (!areAdjacent(a, b, cols)) return false;
  if (pieces[a] === DROP_ITEM && matchable(pieces[b])) return b === a + cols;
  if (pieces[b] === DROP_ITEM && matchable(pieces[a])) return a === b + cols;
  return false;
}

/** 交換後會消除：湊出三連，或特殊糖與可消除鄰格交換。不含禮物例外。 */
export function swapMakesClear(
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

/**
 * 玩家交換合法性的唯一來源：會消除，或把禮物往下送。
 * 提示、模擬與玩家交換都經這裡，不在 View 另寫例外。
 */
export function swapIsLegal(
  pieces: number[],
  specials: CandySpecial[],
  a: number,
  b: number,
  cols: number,
  rows: number,
): boolean {
  return (
    swapMakesClear(pieces, specials, a, b, cols, rows) ||
    isGiftDropSwap(pieces, a, b, cols)
  );
}

/** 列出所有相鄰交換對（每對只出現一次：右鄰與下鄰）。 */
export function adjacentPairs(cols: number, rows: number): Array<{ a: number; b: number }> {
  const out: Array<{ a: number; b: number }> = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const a = idx(c, r, cols);
      if (c + 1 < cols) out.push({ a, b: a + 1 });
      if (r + 1 < rows) out.push({ a, b: a + cols });
    }
  }
  return out;
}

/** 列出所有合法交換（含禮物例外）。 */
export function listLegalMoves(state: BoardState): Array<{ a: number; b: number }> {
  const specials = state.specials ?? emptySpecials(state.pieces.length);
  return adjacentPairs(state.cols, state.rows).filter(({ a, b }) =>
    swapIsLegal(state.pieces, specials, a, b, state.cols, state.rows),
  );
}

/**
 * 找一步會消除的交換（提示與「是否需要重排」用）；無解回傳 null。
 * 只算會消除的步，禮物下送不算，避免只剩禮物步時卡關。
 */
export function findHintMove(
  pieces: number[],
  cols: number,
  rows: number,
  specials: CandySpecial[] = emptySpecials(pieces.length),
): { a: number; b: number } | null {
  for (const pair of adjacentPairs(cols, rows)) {
    if (swapMakesClear(pieces, specials, pair.a, pair.b, cols, rows)) return pair;
  }
  return null;
}

/** 找一步能做出直線特殊糖（四連以上）的交換；無則 null。L/T 不在這裡，開局仍先教掃把。 */
export function findSpecialMove(
  pieces: number[],
  cols: number,
  rows: number,
): { a: number; b: number } | null {
  for (const pair of adjacentPairs(cols, rows)) {
    if (!matchable(pieces[pair.a]) || !matchable(pieces[pair.b])) continue;
    const next = swapped(pieces, pair.a, pair.b);
    if (findMatchRuns(next, cols, rows).some((run) => run.length >= 4)) return pair;
  }
  return null;
}

function runDirection(cells: readonly number[]): "h" | "v" {
  return cells.length >= 2 && cells[1]! - cells[0]! === 1 ? "h" : "v";
}

/**
 * 一連線一個特殊糖。五連優先於交叉；交叉（L/T，含其中一臂是四連）留下爆炸糖；
 * 單純四連留下掃把。特殊糖留在交換格（preferCells），讓孩子看見是自己做出來的。
 */
export function planSpecialSpawns(
  pieces: number[],
  cols: number,
  rows: number,
  preferCells: readonly number[] = [],
): SpecialSpawn[] {
  const runs = findMatchRuns(pieces, cols, rows);
  const parent = runs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  const unite = (a: number, b: number) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent[pa] = pb;
  };
  const owner = new Map<number, number>();
  runs.forEach((run, i) => {
    for (const cell of run.cells) {
      const prev = owner.get(cell);
      if (prev == null) owner.set(cell, i);
      else unite(prev, i);
    }
  });
  const groups = new Map<number, number[]>();
  runs.forEach((_, i) => {
    const root = find(i);
    const list = groups.get(root);
    if (list) list.push(i);
    else groups.set(root, [i]);
  });

  const spawns: SpecialSpawn[] = [];
  const used = new Set<number>();
  for (const indexes of groups.values()) {
    let maxLen = 0;
    let hasH = false;
    let hasV = false;
    const cells: number[] = [];
    const seen = new Set<number>();
    for (const i of indexes) {
      const run = runs[i]!;
      maxLen = Math.max(maxLen, run.length);
      if (runDirection(run.cells) === "h") hasH = true;
      else hasV = true;
      for (const cell of run.cells) {
        if (seen.has(cell)) continue;
        seen.add(cell);
        cells.push(cell);
      }
    }
    const kind: Exclude<CandySpecial, "none"> | null =
      maxLen >= 5 ? "color" : hasH && hasV ? "burst" : maxLen >= 4 ? "row" : null;
    if (!kind) continue;
    const preferred = preferCells.find((cell) => seen.has(cell) && !used.has(cell));
    const index = preferred ?? cells.find((cell) => !used.has(cell));
    if (index == null) continue;
    used.add(index);
    spawns.push({ index, kind });
  }
  return spawns;
}

function boardRows(pieces: number[], cols: number): number {
  return cols > 0 ? Math.floor(pieces.length / cols) : 0;
}

/** 爆炸糖：以自身為中心的 3×3，超出棋盤的部分不算，禮物與空格不消。 */
function burstCells(pieces: number[], origin: number, cols: number): number[] {
  const rows = boardRows(pieces, cols);
  const col = origin % cols;
  const row = Math.floor(origin / cols);
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const i = idx(nc, nr, cols);
      if (pieces[i] >= 0) out.push(i);
    }
  }
  return out;
}

/** 掃把＋掃把：兩顆所在的橫排與直欄組成十字。 */
function crossCells(pieces: number[], a: number, b: number, cols: number): number[] {
  const rows = boardRows(pieces, cols);
  const rowSet = new Set([Math.floor(a / cols), Math.floor(b / cols)]);
  const colSet = new Set([a % cols, b % cols]);
  const out: number[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!rowSet.has(r) && !colSet.has(c)) continue;
      const i = idx(c, r, cols);
      if (pieces[i] >= 0) out.push(i);
    }
  }
  return out;
}

function specialRank(kind: CandySpecial): number {
  if (kind === "burst") return 0;
  if (kind === "row") return 1;
  if (kind === "color") return 2;
  return 3;
}

export function cellsClearedBySpecial(
  pieces: number[],
  specials: CandySpecial[],
  origin: number,
  cols: number,
): number[] {
  const kind = specials[origin];
  if (kind === "none" || kind == null) return [];
  if (kind === "burst") return burstCells(pieces, origin, cols);
  if (kind === "row") {
    const row = Math.floor(origin / cols);
    const out: number[] = [];
    for (let c = 0; c < cols; c++) {
      const i = idx(c, row, cols);
      if (pieces[i] >= 0) out.push(i);
    }
    return out;
  }
  const color = pieces[origin];
  if (color < 0) return [];
  const out: number[] = [];
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
  const out = new Set(initial);
  const queue = [...out];
  while (queue.length > 0) {
    queue.sort((a, b) => specialRank(specials[a] ?? "none") - specialRank(specials[b] ?? "none"));
    const i = queue.shift();
    if (i == null || specials[i] === "none" || specials[i] == null) continue;
    for (const j of cellsClearedBySpecial(pieces, specials, i, cols)) {
      if (!out.has(j)) {
        out.add(j);
        queue.push(j);
      }
    }
  }
  return out;
}

function comboKind(a: CandySpecial, b: CandySpecial): CandyComboKind | null {
  const key = [a, b].sort().join("+");
  if (key === "row+row") return "cross";
  if (key === "color+row") return "color-brooms";
  if (key === "color+color") return "clear-board";
  return null;
}

/** 玩家把兩顆相鄰特殊糖換在一起時才成立；道具與連鎖引爆不走這裡。 */
function readCombo(
  extraCells: Iterable<number> | undefined,
  specials: CandySpecial[],
  cols: number,
): { a: number; b: number; kind: CandyComboKind } | null {
  if (!extraCells) return null;
  const cells = [...new Set(extraCells)];
  if (cells.length !== 2) return null;
  const a = cells[0];
  const b = cells[1];
  if (a == null || b == null || !areAdjacent(a, b, cols)) return null;
  const ka = specials[a] ?? "none";
  const kb = specials[b] ?? "none";
  const kind = comboKind(ka, kb);
  if (!kind) return null;
  return { a, b, kind };
}

function colorBroomClear(
  pieces: number[],
  specials: CandySpecial[],
  a: number,
  b: number,
  cols: number,
): { clear: Set<number>; becomeRow: number[] } {
  const broom = specials[a] === "row" ? a : b;
  const rainbow = broom === a ? b : a;
  const color = pieces[broom] ?? EMPTY;
  const becomeRow: number[] = [];
  if (color >= 0) {
    pieces.forEach((piece, i) => {
      if (piece === color && i !== rainbow) becomeRow.push(i);
    });
  }
  const virtual = specials.slice();
  virtual[rainbow] = "none";
  for (const i of becomeRow) virtual[i] = "row";
  const clear = expandClearsWithSpecials(pieces, virtual, [broom, rainbow, ...becomeRow], cols);
  return { clear, becomeRow };
}

function mergeUnmatched(
  clear: Set<number>,
  pieces: number[],
  specials: CandySpecial[],
  matches: ReadonlySet<number>,
  cols: number,
): Set<number> {
  let added = false;
  const seed = new Set(clear);
  for (const i of matches) {
    if (seed.has(i)) continue;
    seed.add(i);
    added = true;
  }
  if (!added) return clear;
  return expandClearsWithSpecials(pieces, specials, seed, cols);
}

function collectDetonated(
  clear: ReadonlySet<number>,
  specials: CandySpecial[],
): Array<Exclude<CandySpecial, "none">> {
  const detonated: Array<Exclude<CandySpecial, "none">> = [];
  for (const i of clear) {
    const kind = specials[i];
    if (kind && kind !== "none") detonated.push(kind);
  }
  detonated.sort((a, b) => specialRank(a) - specialRank(b));
  return detonated;
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
  combo?: CandyCombo;
} {
  const matches = extraOnly ? new Set<number>() : findMatches(pieces, cols, rows);
  const pair = extraOnly ? null : readCombo(extraCells, specials, cols);
  let clear = new Set<number>();
  let combo: CandyCombo | undefined;

  if (pair?.kind === "cross") {
    clear = expandClearsWithSpecials(pieces, specials, crossCells(pieces, pair.a, pair.b, cols), cols);
    clear = mergeUnmatched(clear, pieces, specials, matches, cols);
    combo = { kind: "cross", becomeRow: [] };
  } else if (pair?.kind === "clear-board") {
    pieces.forEach((piece, i) => {
      if (piece >= 0) clear.add(i);
    });
    combo = { kind: "clear-board", becomeRow: [] };
  } else if (pair?.kind === "color-brooms") {
    const turned = colorBroomClear(pieces, specials, pair.a, pair.b, cols);
    const virtual = specials.slice();
    const rainbow = specials[pair.a] === "color" ? pair.a : pair.b;
    virtual[rainbow] = "none";
    for (const i of turned.becomeRow) virtual[i] = "row";
    clear = mergeUnmatched(turned.clear, pieces, virtual, matches, cols);
    combo = { kind: "color-brooms", becomeRow: turned.becomeRow };
  } else {
    const initial = new Set(matches);
    if (extraCells) {
      for (const i of extraCells) initial.add(i);
    }
    if (initial.size === 0) return { clear, spawns: [], detonated: [] };
    clear = expandClearsWithSpecials(pieces, specials, initial, cols);
  }

  const detonated = collectDetonated(clear, specials);
  const becomeRow = new Set(combo?.becomeRow ?? []);
  const spawns =
    extraOnly || combo?.kind === "clear-board"
      ? []
      : planSpecialSpawns(pieces, cols, rows, preferSpawnAt).filter((spawn) => {
          if (!matches.has(spawn.index)) return false;
          if (specials[spawn.index] !== "none") return false;
          if (becomeRow.has(spawn.index)) return false;
          return true;
        });
  for (const spawn of spawns) clear.delete(spawn.index);
  return { clear, spawns, detonated, combo };
}

export function applySpecialSpawns(
  specials: CandySpecial[],
  spawns: SpecialSpawn[],
): CandySpecial[] {
  const next = specials.slice();
  for (const spawn of spawns) next[spawn.index] = spawn.kind;
  return next;
}

export function randomPiece(kinds: number, rng: Rng): number {
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
/** 特殊糖組合：先讓孩子看見效果，再進入消除。減少動態時應跳過。 */
export const CANDY_COMBO_MS = 320;

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

/** 重力與禮物送達的一個段落：UI 依 falls 播掉落，再顯示 board。 */
export type SettlePhase = {
  falls: CandyFallMotion[];
  board: BoardState;
  /** 這段落開始前送達的禮物數 */
  dropped: number;
};

/**
 * 讓棋盤穩定：送達底排禮物 → 重力補格，重複到沒有空格與底排禮物。
 * 禮物送達後空出的格子也會補滿，不會留下空洞。
 */
export function settleBoard(
  state: BoardState,
  kinds: number,
  rng: Rng,
): { state: BoardState; phases: SettlePhase[]; dropped: number } {
  const { cols, rows } = state;
  let pieces = state.pieces.slice();
  let specials = (state.specials ?? emptySpecials(pieces.length)).slice();
  const phases: SettlePhase[] = [];
  let dropped = 0;
  let guard = rows * cols + 4;
  while (guard-- > 0) {
    const drops = collectBottomDrops(pieces, cols, rows, specials);
    pieces = drops.pieces;
    specials = drops.specials;
    dropped += drops.dropped;
    if (!pieces.includes(EMPTY)) {
      if (drops.dropped > 0) {
        phases.push({ falls: [], board: { ...state, pieces, specials }, dropped: drops.dropped });
      }
      break;
    }
    const falls = planGravity(pieces, cols, rows);
    const fallen = applyGravity(pieces, cols, rows, kinds, rng, specials);
    pieces = fallen.pieces;
    specials = fallen.specials;
    phases.push({ falls, board: { ...state, pieces, specials }, dropped: drops.dropped });
  }
  return { state: { ...state, pieces, specials }, phases, dropped };
}

/** 一波消除的完整結果：動畫與純解算共用。 */
export type WaveStep = {
  cleared: number[];
  detonated: Array<Exclude<CandySpecial, "none">>;
  spawns: SpecialSpawn[];
  /** 這波是特殊糖組合時才有；先演出再結算。 */
  combo?: CandyCombo;
  /** 消除＋留下特殊糖後、重力前 */
  afterClear: BoardState;
  phases: SettlePhase[];
  /** 本波結束的穩定盤面 */
  state: BoardState;
  collected: number[];
  cleaned: number;
  dropped: number;
};

export type WaveOptions = {
  /** 額外要清的格（特殊糖交換、道具） */
  extraCells?: Iterable<number>;
  /** 新特殊糖優先留在這些格（交換的兩格） */
  preferSpawnAt?: readonly number[];
  /** 只清 extraCells，不看三連（道具） */
  extraOnly?: boolean;
};

/** 解算一波；沒有可消除時回傳 null。 */
export function stepWave(
  state: BoardState,
  kinds: number,
  rng: Rng,
  options: WaveOptions = {},
): WaveStep | null {
  const { cols, rows } = state;
  const specials = state.specials ?? emptySpecials(state.pieces.length);
  const planned = planWaveClears(
    state.pieces,
    specials,
    cols,
    rows,
    options.extraCells,
    options.preferSpawnAt ?? [],
    Boolean(options.extraOnly),
  );
  if (planned.clear.size === 0 && planned.spawns.length === 0) return null;
  const cleared = clearCells(state.pieces, state.dirt, planned.clear, kinds, specials);
  const afterClear: BoardState = {
    cols,
    rows,
    pieces: cleared.pieces,
    dirt: cleared.dirt,
    specials: applySpecialSpawns(cleared.specials, planned.spawns),
  };
  const settled = settleBoard(afterClear, kinds, rng);
  return {
    cleared: [...planned.clear],
    detonated: planned.detonated,
    spawns: planned.spawns,
    combo: planned.combo,
    afterClear,
    phases: settled.phases,
    state: settled.state,
    collected: cleared.collected,
    cleaned: cleared.cleaned,
    dropped: settled.dropped,
  };
}

/** 單次解算的連鎖上限。 */
export const MAX_RESOLVE_WAVES = 100;

export function emptyEvents(kinds: number): ResolveEvents {
  return {
    collected: Array<number>(kinds).fill(0),
    cleaned: 0,
    dropped: 0,
    waves: 0,
    detonated: 0,
    specialsMade: 0,
    clearedByWave: [],
  };
}

/** 把一波結果累加進事件統計（回傳新物件）。 */
export function addWaveEvents(events: ResolveEvents, wave: WaveStep): ResolveEvents {
  return {
    collected: events.collected.map((n, i) => n + (wave.collected[i] ?? 0)),
    cleaned: events.cleaned + wave.cleaned,
    dropped: events.dropped + wave.dropped,
    waves: events.waves + 1,
    detonated: events.detonated + wave.detonated.length,
    specialsMade: events.specialsMade + wave.spawns.length,
    clearedByWave: [...events.clearedByWave, wave.cleared],
  };
}

/**
 * 解算整個消除流程（先穩定 → 逐波消除、清髒、重力、送禮物、連鎖），
 * 直到穩定。回傳新狀態與事件統計。第一波可帶 options（交換／道具）。
 */
export function resolveBoard(
  state: BoardState,
  kinds: number,
  rng: Rng,
  options: WaveOptions = {},
): { state: BoardState; events: ResolveEvents } {
  const pre = settleBoard(
    { ...state, specials: state.specials ?? emptySpecials(state.pieces.length) },
    kinds,
    rng,
  );
  let current = pre.state;
  let events: ResolveEvents = { ...emptyEvents(kinds), dropped: pre.dropped };
  // 連鎖超過上限（實務上不會發生）時回傳當下盤面；呼叫端見到仍有三連會重排
  let guard = MAX_RESOLVE_WAVES;
  let first = true;
  while (guard-- > 0) {
    const wave = stepWave(current, kinds, rng, first ? options : {});
    first = false;
    if (!wave) break;
    events = addWaveEvents(events, wave);
    current = wave.state;
  }
  return { state: current, events };
}

/** 道具作用範圍（預覽與實際使用共用）：泡泡單格、掃把整排、彩虹同款。 */
export function propAffectedCells(
  kind: "bubble" | "broom" | "rainbow",
  state: Pick<BoardState, "cols" | "pieces">,
  target: number,
): number[] {
  const { cols, pieces } = state;
  const v = pieces[target];
  if (v == null) return [];
  if (kind === "bubble") return v >= 0 ? [target] : [];
  if (kind === "rainbow") {
    if (v < 0) return [];
    const out: number[] = [];
    pieces.forEach((p, i) => {
      if (p === v) out.push(i);
    });
    return out;
  }
  const row = Math.floor(target / cols);
  const out: number[] = [];
  for (let c = 0; c < cols; c++) {
    const i = idx(c, row, cols);
    if (pieces[i] >= 0) out.push(i);
  }
  return out;
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
