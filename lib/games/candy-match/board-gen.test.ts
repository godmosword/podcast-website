import { describe, expect, it } from "vitest";
import {
  createBoard,
  fallbackBoard,
  isValidStartBoard,
  reshuffle,
  type BoardGenOptions,
} from "./board-gen";
import { DROP_ITEM, emptySpecials, findHintMove, findMatches, type BoardState } from "./engine";
import { CANDY_MATCH_LEVELS } from "./levels";
import { seededRng } from "./rng";
import { CANDY_STAGES, type CandyStage } from "./stages";

type Config = { label: string; cols: number; rows: number; kinds: number; options: BoardGenOptions };

function stageConfigs(): Config[] {
  const out: Config[] = [];
  for (const mode of ["easy", "challenge"] as const) {
    CANDY_STAGES[mode].forEach((set, li) => {
      const level = CANDY_MATCH_LEVELS[li]!;
      for (const stage of [set.main, ...set.variants] as CandyStage[]) {
        out.push({
          label: `${mode}/${stage.id}`,
          cols: level.cols,
          rows: level.rows,
          kinds: stage.pieceKinds,
          options: {
            dirtCells: stage.dirtCells,
            dropCount: stage.dropCount,
            requireSpecialMove: stage.requireSpecialMove,
          },
        });
      }
    });
  }
  return out;
}

const CONFIGS = stageConfigs();

describe("createBoard：所有關卡 × 玩法 × 變體", () => {
  it("每個配置 200 個固定 seed 都符合開局不變量", () => {
    for (const config of CONFIGS) {
      for (let seed = 1; seed <= 200; seed++) {
        const board = createBoard(config.cols, config.rows, config.kinds, seededRng(seed), config.options);
        if (!isValidStartBoard(board, config.options)) {
          throw new Error(`${config.label} seed=${seed} 開局不合格`);
        }
      }
    }
  });

  it("固定／偏斜 RNG 也拿得到含正確任務物件的保底盤", () => {
    const skewed = [() => 0, () => 0.999999, () => 0.5];
    for (const config of CONFIGS) {
      for (const rng of skewed) {
        const board = createBoard(config.cols, config.rows, config.kinds, rng, config.options);
        expect(isValidStartBoard(board, config.options), config.label).toBe(true);
        expect(board.pieces.filter((v) => v === DROP_ITEM).length).toBe(config.options.dropCount ?? 0);
        expect(board.dirt.filter(Boolean).length).toBe(config.options.dirtCells?.length ?? 0);
      }
    }
  });

  it("保底盤依配置決定性產生", () => {
    for (const config of CONFIGS) {
      const a = fallbackBoard(config.cols, config.rows, config.kinds, config.options);
      const b = fallbackBoard(config.cols, config.rows, config.kinds, config.options);
      expect(a.pieces).toEqual(b.pieces);
      expect(isValidStartBoard(a, config.options)).toBe(true);
    }
  });

  it("多個禮物都在頂排且各在不同欄", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const board = createBoard(6, 8, 5, seededRng(seed), { dropCount: 3 });
      const gifts = board.pieces.flatMap((v, i) => (v === DROP_ITEM ? [i] : []));
      expect(gifts).toHaveLength(3);
      expect(gifts.every((i) => i < 6)).toBe(true);
      expect(new Set(gifts.map((i) => i % 6)).size).toBe(3);
    }
  });

  it("髒格依區域模板放置", () => {
    const cells = [0, 5, 30, 35];
    const board = createBoard(6, 6, 4, seededRng(3), { dirtCells: cells });
    expect(board.dirt.flatMap((d, i) => (d ? [i] : []))).toEqual(cells);
  });

  it("replay 可避開上一盤完全相同的盤面", () => {
    const first = createBoard(6, 6, 4, seededRng(17));
    const replay = createBoard(6, 6, 4, seededRng(17), { avoidBoard: first });
    expect(replay.pieces).not.toEqual(first.pieces);
    expect(isValidStartBoard(replay)).toBe(true);
  });
});

describe("reshuffle", () => {
  it("保留髒格、禮物位置與特殊糖數量，結果無三連且有解", () => {
    const base = createBoard(6, 8, 4, seededRng(5), { dropCount: 2, dirtCells: [12, 13] });
    const specials = emptySpecials(base.pieces.length);
    specials[20] = "row";
    const state: BoardState = { ...base, specials };
    const next = reshuffle(state, seededRng(9), 4);
    expect(next.dirt).toEqual(state.dirt);
    state.pieces.forEach((v, i) => {
      if (v === DROP_ITEM) expect(next.pieces[i]).toBe(DROP_ITEM);
    });
    expect(next.specials.filter((s) => s !== "none")).toHaveLength(1);
    expect(findMatches(next.pieces, 6, 8).size).toBe(0);
    expect(findHintMove(next.pieces, 6, 8, next.specials)).not.toBeNull();
  });

  it("洗牌湊不出解時改為重新配色，不回傳無合法步的盤面", () => {
    // 全部同色：怎麼洗都三連，必須重新配色
    const state: BoardState = {
      cols: 6,
      rows: 6,
      pieces: Array(36).fill(1),
      dirt: Array(36).fill(false),
      specials: emptySpecials(36),
    };
    const next = reshuffle(state, () => 0, 4);
    expect(findMatches(next.pieces, 6, 6).size).toBe(0);
    expect(findHintMove(next.pieces, 6, 6, next.specials)).not.toBeNull();
  });

  it("隨機洗牌與重配色都失敗時，構造式保底仍給出可玩盤", () => {
    // RNG 永遠回 0 → 重配色每格都想塗 0，必須靠構造式保底
    const state: BoardState = {
      cols: 6,
      rows: 8,
      pieces: Array(48).fill(2),
      dirt: Array(48).fill(false),
      specials: emptySpecials(48),
    };
    state.pieces[0] = DROP_ITEM;
    const next = reshuffle(state, () => 0, 4);
    expect(next.pieces[0]).toBe(DROP_ITEM);
    expect(findMatches(next.pieces, 6, 8).size).toBe(0);
    expect(findHintMove(next.pieces, 6, 8, next.specials)).not.toBeNull();
  });
});
