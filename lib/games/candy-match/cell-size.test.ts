import { describe, expect, it } from "vitest";
import {
  CANDY_MATCH_BOARD_PADDING,
  CANDY_MATCH_CELL_GAP,
  candyMatchBoardOuterWidth,
  candyMatchCellPx,
} from "./cell-size";

describe("candyMatchCellPx", () => {
  it("6 欄 @ 320px 可用寬 → cell 48，外框 ≤ 340", () => {
    const cellPx = candyMatchCellPx(320, 6);
    expect(cellPx).toBe(48);
    expect(candyMatchBoardOuterWidth(cellPx, 6)).toBeLessThanOrEqual(340);
    expect(CANDY_MATCH_CELL_GAP).toBe(4);
    expect(CANDY_MATCH_BOARD_PADDING).toBe(6);
  });

  it("6 欄 @ 390px 可用寬 → cell 59", () => {
    expect(candyMatchCellPx(390, 6)).toBe(59);
  });

  it("寬螢幕 6 欄上限 64", () => {
    expect(candyMatchCellPx(2000, 6)).toBe(64);
  });
});
