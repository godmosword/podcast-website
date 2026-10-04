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

/** 找一步能做出特殊糖（四連以上）的交換；無則 null。 */
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
