import { describe, expect, it } from "vitest";
import {
  CANDY_MATCH_BOARD_PADDING,
  CANDY_MATCH_CELL_GAP,
  candyMatchBoardOuterHeight,
  candyMatchBoardOuterWidth,
  candyMatchCellPx,
  candyMatchCellStep,
  candyMatchSwapOffset,
} from "./cell-size";

describe("candyMatchCellPx", () => {
  it("6 欄可用寬對上 56／51／44，外框不超出可用寬", () => {
    expect(CANDY_MATCH_CELL_GAP).toBe(3);
    expect(CANDY_MATCH_BOARD_PADDING).toBe(2);
    expect(candyMatchCellPx(358, 6)).toBe(56);
    expect(candyMatchBoardOuterWidth(56, 6)).toBeLessThanOrEqual(358);
    expect(candyMatchCellPx(328, 6)).toBe(51);
    expect(candyMatchBoardOuterWidth(51, 6)).toBeLessThanOrEqual(328);
    expect(candyMatchCellPx(288, 6)).toBe(44);
    expect(candyMatchBoardOuterWidth(44, 6)).toBeLessThanOrEqual(288);
  });

  it("寬螢幕 6 欄上限 80，算不滿 44 時停在 44", () => {
    expect(candyMatchCellPx(2000, 6)).toBe(80);
    expect(candyMatchCellPx(200, 6)).toBe(44);
  });

  it("可用高較小時以高度為準，但不低於 44（改由整頁捲動）", () => {
    // 6×8：寬 800 可到 80，高 500 只能 59
    expect(candyMatchCellPx(800, 6, 500, 8)).toBe(59);
    expect(candyMatchBoardOuterHeight(59, 8)).toBeLessThanOrEqual(500);
    expect(candyMatchCellPx(800, 6, 200, 8)).toBe(44);
    // 320 寬手機：六欄 44px 外寬 283
    expect(candyMatchCellPx(296, 6, 1000, 8)).toBe(46);
    expect(candyMatchBoardOuterWidth(44, 6)).toBe(283);
    expect(candyMatchBoardOuterHeight(44, 8)).toBe(377);
  });
});

describe("candyMatchSwapOffset", () => {
  it("相鄰格位移等於 cell + gap", () => {
    expect(candyMatchCellStep(48)).toBe(51);
    expect(candyMatchSwapOffset(0, 1, 3, 48)).toEqual({ dx: 51, dy: 0 });
    expect(candyMatchSwapOffset(0, 3, 3, 48)).toEqual({ dx: 0, dy: 51 });
  });
});
