/** 棋盤格間距（px） */
export const CANDY_MATCH_CELL_GAP = 4;

/** 棋盤外框內距（px） */
export const CANDY_MATCH_BOARD_PADDING = 6;

/** 依可用棋盤寬度與欄數計算每格像素（min 48、max 64）。 */
export function candyMatchCellPx(availableWidth: number, cols: number): number {
  return Math.max(
    48,
    Math.min(
      64,
      Math.floor(
        (availableWidth - 2 * CANDY_MATCH_BOARD_PADDING - (cols - 1) * CANDY_MATCH_CELL_GAP) /
          cols,
      ),
    ),
  );
}

/** 棋盤外框總寬（含 gap 與 padding）。 */
export function candyMatchBoardOuterWidth(cellPx: number, cols: number): number {
  return cols * cellPx + (cols - 1) * CANDY_MATCH_CELL_GAP + 2 * CANDY_MATCH_BOARD_PADDING;
}
