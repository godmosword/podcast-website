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

/** 相鄰兩格中心距（格寬 + gap），給 swap／fall 的 translate 用。 */
export function candyMatchCellStep(cellPx: number): number {
  return cellPx + CANDY_MATCH_CELL_GAP;
}

/** 從 from 格走到 to 格的像素位移（僅相鄰時有意義）。 */
export function candyMatchSwapOffset(
  from: number,
  to: number,
  cols: number,
  cellPx: number,
): { dx: number; dy: number } {
  const step = candyMatchCellStep(cellPx);
  const dc = (to % cols) - (from % cols);
  const dr = Math.floor(to / cols) - Math.floor(from / cols);
  return { dx: dc * step, dy: dr * step };
}
