/** 棋盤格間距（px）。收成 3，讓 390 寬的 6 欄能到 56px。 */
export const CANDY_MATCH_CELL_GAP = 3;

/** 棋盤外框內距（px） */
export const CANDY_MATCH_BOARD_PADDING = 2;

/** 格子是按鈕：觸控下限 44px；寬螢幕上限 80px。 */
export const CANDY_MATCH_CELL_MIN = 44;
export const CANDY_MATCH_CELL_MAX = 80;

function fit(available: number, count: number): number {
  return Math.floor(
    (available - 2 * CANDY_MATCH_BOARD_PADDING - (count - 1) * CANDY_MATCH_CELL_GAP) / count,
  );
}

/**
 * 依可用寬（與可選的可用高）計算每格像素，夾在 44–80。
 * 高度不夠時先縮格子；縮到 44 仍放不下就讓整頁捲動，不裁切也不再縮。
 */
export function candyMatchCellPx(
  availableWidth: number,
  cols: number,
  availableHeight?: number,
  rows?: number,
): number {
  const byWidth = fit(availableWidth, cols);
  const byHeight =
    availableHeight != null && rows != null && availableHeight > 0 ? fit(availableHeight, rows) : byWidth;
  return Math.max(CANDY_MATCH_CELL_MIN, Math.min(CANDY_MATCH_CELL_MAX, byWidth, byHeight));
}

/** 棋盤外框總高（含 gap 與 padding）。 */
export function candyMatchBoardOuterHeight(cellPx: number, rows: number): number {
  return candyMatchBoardOuterWidth(cellPx, rows);
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
