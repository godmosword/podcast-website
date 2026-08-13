import { describe, expect, it } from "vitest";
import {
  DROP_ITEM,
  EMPTY,
  applySpecialSpawns,
  applyGravity,
  areAdjacent,
  clearCells,
  createBoard,
  emptySpecials,
  expandClearsWithSpecials,
  planGravity,
  planSpecialSpawns,
  planWaveClears,
  findHintMove,
  findMatches,
  idx,
  reshuffle,
  resolveBoard,
  swapCreatesMatch,
  swapIsLegal,
  swapped,
  type BoardState,
  type CandySpecial,
} from "./engine";
import { CANDY_MATCH_LEVELS, kidsModeLevel } from "./levels";

/** 決定性 RNG（LCG），讓測試可重現。 */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function board(cols: number, rows: number, pieces: number[]): BoardState {
  return {
    cols,
    rows,
    pieces,
    dirt: Array(cols * rows).fill(false),
    specials: Array(cols * rows).fill("none"),
  };
}

describe("findMatches", () => {
  it("偵測橫向與直向三連，不算斜線", () => {
    // 3x3：第一列三連
    const m1 = findMatches([0, 0, 0, 1, 2, 1, 2, 1, 2], 3, 3);
    expect(m1).toEqual(new Set([0, 1, 2]));
    // 第一欄直向三連
    const m2 = findMatches([0, 1, 2, 0, 2, 1, 0, 1, 2], 3, 3);
    expect(m2).toEqual(new Set([0, 3, 6]));
    // 斜線不算
    const m3 = findMatches([0, 1, 2, 1, 0, 2, 2, 1, 0], 3, 3);
    expect(m3.size).toBe(0);
  });

  it("四連以上整段都消", () => {
    const m = findMatches([1, 1, 1, 1, 0, 2, 0, 2, 0, 2, 0, 2], 4, 3);
    expect(m).toEqual(new Set([0, 1, 2, 3]));
  });

  it("掉落物與空格不參與消除", () => {
    const m = findMatches([DROP_ITEM, DROP_ITEM, DROP_ITEM, EMPTY, EMPTY, EMPTY, 0, 1, 0], 3, 3);
    expect(m.size).toBe(0);
  });
});

describe("swap 判定", () => {
  it("只能交換相鄰格", () => {
    expect(areAdjacent(0, 1, 3)).toBe(true);
    expect(areAdjacent(0, 3, 3)).toBe(true);
    expect(areAdjacent(0, 4, 3)).toBe(false);
    expect(areAdjacent(2, 3, 3)).toBe(false); // 跨列不相鄰
  });

  it("swapCreatesMatch 正確判斷合法步", () => {
    // 交換 idx0(1)↔idx3(0) → 第一列變 0,0,0 ✓
    const pieces = [
      1, 0, 0,
      0, 2, 2,
      2, 1, 1,
    ];
    expect(swapCreatesMatch(pieces, 0, 3, 3, 3)).toBe(true);
    // 拉丁方陣：任何相鄰交換最多兩連 → 全為非法步
    const latin = [
      0, 1, 2,
      1, 2, 0,
      2, 0, 1,
    ];
    expect(swapCreatesMatch(latin, 0, 1, 3, 3)).toBe(false);
    expect(swapCreatesMatch(latin, 4, 7, 3, 3)).toBe(false);
    // 可消案例：交換 idx2(1)↔idx5(0) → 第一列 0,0,0 ✓
    const p3 = [
      0, 0, 1,
      2, 2, 0,
      1, 1, 2,
    ];
    expect(swapCreatesMatch(p3, 2, 5, 3, 3)).toBe(true);
    expect(swapped(p3, 2, 5)[2]).toBe(0);
  });
});

describe("findHintMove", () => {
  it("有解時找得到、無解回 null", () => {
    const solvable = [
      0, 0, 1,
      2, 2, 0,
      1, 1, 2,
    ];
    expect(findHintMove(solvable, 3, 3)).not.toBeNull();
    // 拉丁方陣無解（任何相鄰交換最多兩連）
    const stuck = [
      0, 1, 2,
      1, 2, 0,
      2, 0, 1,
    ];
    expect(findHintMove(stuck, 3, 3)).toBeNull();
  });
});

describe("applyGravity", () => {
  it("往下壓實並從頂部補新", () => {
    const rng = seededRng(7);
    const pieces = [
      EMPTY, 1,
      0, EMPTY,
      EMPTY, 2,
    ];
    const next = applyGravity(pieces, 2, 3, 3, rng);
    // 欄0：只有一個 0 → 沉到底，上面兩格補新
    expect(next.pieces[idx(0, 2, 2)]).toBe(0);
    expect(next.pieces[idx(0, 0, 2)]).toBeGreaterThanOrEqual(0);
    // 欄1：1、2 壓實到下兩格
    expect(next.pieces[idx(1, 2, 2)]).toBe(2);
    expect(next.pieces[idx(1, 1, 2)]).toBe(1);
    expect(next.pieces.every((v) => v >= 0)).toBe(true);
  });

  it("掉落物隨重力下落", () => {
    const rng = seededRng(3);
    const pieces = [DROP_ITEM, EMPTY, 0];
    const next = applyGravity(pieces, 1, 3, 3, rng);
    expect(next.pieces[1]).toBe(DROP_ITEM);
    expect(next.pieces[2]).toBe(0);
  });
});

describe("resolveBoard", () => {
  it("消除→補格→連鎖，事件統計正確", () => {
    const rng = seededRng(42);
    // 3x3 第一列三連（圖案 0），含一個髒髒格
    const state = board(3, 3, [
      0, 0, 0,
      1, 2, 1,
      2, 1, 2,
    ]);
    state.dirt[1] = true;
    const { state: after, events } = resolveBoard(state, 3, rng);
    expect(events.waves).toBeGreaterThanOrEqual(1);
    expect(events.collected[0]).toBeGreaterThanOrEqual(3);
    expect(events.cleaned).toBe(1);
    expect(after.dirt[1]).toBe(false);
    expect(after.pieces.every((v) => v >= 0)).toBe(true);
    expect(findMatches(after.pieces, 3, 3).size).toBe(0);
  });

  it("掉落物到底排即送達", () => {
    const rng = seededRng(9);
    // 1 欄 3 列：禮物在頂、下面兩格將被消除？單欄無法三連，
    // 直接驗證：禮物已在底排 → 立即送達
    const state = board(1, 3, [0, 1, DROP_ITEM]);
    const { state: after, events } = resolveBoard(state, 3, rng);
    expect(events.dropped).toBe(1);
    expect(after.pieces.includes(DROP_ITEM)).toBe(false);
  });
});

describe("createBoard", () => {
  it("無初始三連且至少一步可解（多 seed 驗證）", () => {
    for (const seed of [1, 2, 3, 50, 999]) {
      const rng = seededRng(seed);
      const b = createBoard(6, 6, 5, rng);
      expect(findMatches(b.pieces, 6, 6).size).toBe(0);
      expect(findHintMove(b.pieces, 6, 6, b.specials)).not.toBeNull();
      expect(b.specials).toEqual(emptySpecials(36));
    }
  });

  it("髒髒格與掉落物依配置生成", () => {
    const rng = seededRng(11);
    const b = createBoard(6, 6, 4, rng, { dirtCount: 5, dropCount: 1 });
    expect(b.dirt.filter(Boolean).length).toBe(5);
    expect(b.pieces.filter((v) => v === DROP_ITEM).length).toBe(1);
  });
});

describe("planGravity", () => {
  it("空格壓實後，既有圖案與新補格都帶掉落列數", () => {
    // 3×3 第 0 欄：頂 0、中空、底 1 → 空 1 格
    const pieces = [
      0, 2, 3,
      EMPTY, 4, 5,
      1, 6, 7,
    ];
    const moves = planGravity(pieces, 3, 3);
    expect(moves).toEqual([
      { to: 3, rows: 1 },
      { to: 0, rows: 1 },
    ]);
  });

  it("滿欄不產生位移", () => {
    expect(planGravity([0, 1, 2, 3, 4, 5, 6, 7, 8], 3, 3)).toEqual([]);
  });
});

describe("reshuffle", () => {
  it("重排後無初始三連且有解，掉落物位置不動", () => {
    const rng = seededRng(5);
    const b = createBoard(6, 6, 4, rng, { dropCount: 1 });
    const dropAt = b.pieces.indexOf(DROP_ITEM);
    const r = reshuffle(b, rng);
    expect(r.pieces.indexOf(DROP_ITEM)).toBe(dropAt);
    expect(findMatches(r.pieces, 6, 6).size).toBe(0);
    expect(findHintMove(r.pieces, 6, 6, r.specials)).not.toBeNull();
  });
});

describe("關卡資料", () => {
  it("共 10 關、index 連續、棋盤不超過 6x6", () => {
    expect(CANDY_MATCH_LEVELS.length).toBe(10);
    CANDY_MATCH_LEVELS.forEach((lv, i) => {
      expect(lv.index).toBe(i);
      expect(lv.cols).toBeLessThanOrEqual(6);
      expect(lv.rows).toBeLessThanOrEqual(6);
      expect(lv.pieceKinds).toBeGreaterThanOrEqual(3);
      expect(lv.pieceKinds).toBeLessThanOrEqual(5);
    });
  });

  it("兒童模式覆寫：5x5、最多 4 種、不限步數", () => {
    const lv = kidsModeLevel(CANDY_MATCH_LEVELS[5]);
    expect(lv.cols).toBe(5);
    expect(lv.rows).toBe(5);
    expect(lv.pieceKinds).toBeLessThanOrEqual(4);
    expect(lv.moves).toBe(0);
  });

  it("兒童模式降低任務量且不會製造無法完成的清潔任務", () => {
    const clean = kidsModeLevel(CANDY_MATCH_LEVELS[4]);
    const parade = kidsModeLevel(CANDY_MATCH_LEVELS[8]);
    expect(clean.dirtCount).toBe(3);
    expect(clean.task.kind).toBe("clean-dirt");
    if (clean.task.kind === "clean-dirt") {
      expect(clean.task.count).toBeLessThanOrEqual(clean.dirtCount ?? 0);
    }
    expect(parade.task.kind).toBe("collect-multi");
    if (parade.task.kind === "collect-multi") {
      expect(parade.task.targets.every((target) => target.count <= 4)).toBe(true);
    }
  });

  it("任務型涵蓋三種＋教學/慶祝關", () => {
    const kinds = new Set(CANDY_MATCH_LEVELS.map((lv) => lv.task.kind));
    expect(kinds.has("collect")).toBe(true);
    expect(kinds.has("clean-dirt")).toBe(true);
    expect(kinds.has("drop-item")).toBe(true);
    expect(kinds.has("clear-any")).toBe(true);
  });
});

describe("特殊糖", () => {
  it("四連在交換格留下掃把糖", () => {
    // 第一列 0,0,1,0 → 交換 idx2(1) 與 idx6(0) 後變 0,0,0,0
    const pieces = [
      0, 0, 1, 0,
      2, 3, 0, 2,
      3, 2, 3, 1,
    ];
    const swappedPieces = swapped(pieces, 2, 6);
    const spawns = planSpecialSpawns(swappedPieces, 4, 3, [2, 6]);
    expect(spawns).toEqual([{ index: 2, kind: "row" }]);
  });

  it("五連留下彩虹糖", () => {
    const pieces = [0, 0, 0, 0, 0, 1, 2, 1, 2, 1];
    const spawns = planSpecialSpawns(pieces, 5, 2, [2]);
    expect(spawns).toEqual([{ index: 2, kind: "color" }]);
  });

  it("掃把糖啟動清掉整排可消除格", () => {
    const pieces = [
      0, 1, 2, 3,
      1, 2, 3, 0,
    ];
    const specials: CandySpecial[] = emptySpecials(8);
    specials[1] = "row";
    const cleared = expandClearsWithSpecials(pieces, specials, [1], 4);
    expect(cleared).toEqual(new Set([0, 1, 2, 3]));
  });

  it("彩虹糖啟動清掉同色", () => {
    const pieces = [
      0, 1, 0,
      2, 0, 1,
    ];
    const specials: CandySpecial[] = emptySpecials(6);
    specials[0] = "color";
    const cleared = expandClearsWithSpecials(pieces, specials, [0], 3);
    expect(cleared).toEqual(new Set([0, 2, 4]));
  });

  it("雙特殊糖相換：先掃把再彩虹", () => {
    const pieces = [
      0, 1, 2, 3,
      1, 0, 1, 2,
    ];
    const specials: CandySpecial[] = emptySpecials(8);
    specials[0] = "row";
    specials[1] = "color";
    const wave = planWaveClears(pieces, specials, 4, 2, [0, 1], [0, 1], false);
    expect(wave.detonated[0]).toBe("row");
    expect(wave.detonated).toContain("color");
    expect(wave.clear.has(0)).toBe(true);
    expect(wave.clear.has(1)).toBe(true);
  });

  it("特殊糖與鄰格交換不必先湊三連", () => {
    const pieces = [
      0, 1, 2,
      1, 2, 0,
      2, 0, 1,
    ];
    const specials: CandySpecial[] = emptySpecials(9);
    specials[0] = "row";
    expect(swapCreatesMatch(pieces, 0, 1, 3, 3)).toBe(false);
    expect(swapIsLegal(pieces, specials, 0, 1, 3, 3)).toBe(true);
  });

  it("重力讓特殊糖跟著棋子掉落，新補格沒有特殊糖", () => {
    const rng = seededRng(4);
    const pieces = [
      0, 1,
      EMPTY, 2,
      EMPTY, 3,
    ];
    const specials: CandySpecial[] = emptySpecials(6);
    specials[0] = "row";
    const next = applyGravity(pieces, 2, 3, 3, rng, specials);
    expect(next.pieces[idx(0, 2, 2)]).toBe(0);
    expect(next.specials[idx(0, 2, 2)]).toBe("row");
    expect(next.specials[idx(0, 0, 2)]).toBe("none");
    expect(next.specials[idx(0, 1, 2)]).toBe("none");
  });

  it("四連解算當波留下掃把糖，該格不跟著被清掉", () => {
    const pieces = [
      0, 0, 0, 0,
      1, 2, 1, 2,
      2, 1, 2, 1,
    ];
    const specials = emptySpecials(12);
    const wave = planWaveClears(pieces, specials, 4, 3);
    expect(wave.spawns).toEqual([{ index: 0, kind: "row" }]);
    expect(wave.clear.has(0)).toBe(false);
    expect(wave.clear.size).toBe(3);
    const cleared = clearCells(pieces, Array(12).fill(false), wave.clear, 3, specials);
    const nextSpecials = applySpecialSpawns(cleared.specials, wave.spawns);
    expect(cleared.pieces[0]).toBe(0);
    expect(nextSpecials[0]).toBe("row");
    expect(cleared.pieces.filter((v) => v === 0).length).toBe(1);
  });
});
