/**
 * 《多多壽司屋》結算的新貼紙格。純函數。
 * 共用結算站只有 320px 寬，首輪點餐可能一次拿十幾張：放得下就全放，
 * 放不下時最後一格換成「+N」（點了打開貼紙書），不再藏在橫向捲動裡。
 */

export type FreshLayout = {
  /** 露出幾張貼紙。 */
  shown: number;
  /** 「+N」的 N；0 表示不出「+N」。 */
  more: number;
};

function atLeastOne(n: number): number {
  return Math.max(1, Math.floor(n));
}

export function freshLayout(total: number, columns: number, rows: number): FreshLayout {
  const capacity = atLeastOne(columns) * atLeastOne(rows);
  if (total <= capacity) return { shown: total, more: 0 };
  const shown = capacity - 1;
  return { shown, more: total - shown };
}

/** 一列放得下幾格：寬度＋一個間距，除以（格子＋間距）。 */
export function freshColumns(width: number, cell: number, gap: number): number {
  if (cell <= 0) return 1;
  return atLeastOne((width + gap) / (cell + gap));
}
