import { describe, expect, it } from "vitest";
import {
  CANDY_MATCH_BOARD_PADDING,
  CANDY_MATCH_CELL_GAP,
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

  it("寬螢幕 6 欄上限 64，算不滿 44 時停在 44", () => {
    expect(candyMatchCellPx(2000, 6)).toBe(64);
    expect(candyMatchCellPx(200, 6)).toBe(44);
  });
});

describe("candyMatchSwapOffset", () => {
  it("相鄰格位移等於 cell + gap", () => {
    expect(candyMatchCellStep(48)).toBe(51);
    expect(candyMatchSwapOffset(0, 1, 3, 48)).toEqual({ dx: 51, dy: 0 });
    expect(candyMatchSwapOffset(0, 3, 3, 48)).toEqual({ dx: 0, dy: 51 });
  });
});
