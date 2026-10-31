export type LeverKind = "power" | "brake";

/**
 * 桿子取得焦點時的按鍵。整頁的對應是「↑↓ 永遠是動力、←→ 永遠是煞車」（底部鍵位提示也這樣寫）：
 * - 動力桿：↑ 加一格、↓ 減一格（跟整頁同一件事）。
 * - 煞車桿：方向鍵一律交給整頁，滑鼠點了煞車格再按 ↑ 仍是加動力，不會動到煞車。
 * - Home 回 0、End 拉滿，作用在有焦點的那根。
 * 不處理的鍵回 null，讓按鍵照常往上傳。
 */
export function sliderKeyTarget(kind: LeverKind, key: string, index: number, last: number): number | null {
  if (key === "Home") return 0;
  if (key === "End") return last;
  if (kind !== "power") return null;
  if (key === "ArrowUp") return Math.min(last, index + 1);
  if (key === "ArrowDown") return Math.max(0, index - 1);
  return null;
}

/** 桿面在畫面上的位置（像素）與最後一格的索引；索引 0 在最下面。 */
export type LeverFrame = {
  top: number;
  height: number;
  last: number;
};

/** 手指離格線還要再多這麼多才換檔：格高 15%，但不小於 10px（大司機在矮手機上每格只有約 40px）。 */
const HYSTERESIS_RATIO = 0.15;
const HYSTERESIS_MIN_PX = 10;

function rowHeight(frame: LeverFrame): number {
  return frame.height <= 0 ? 1 : frame.height / (frame.last + 1);
}

/** 由上往下數第幾列（0 在最上面），超出桿面夾在頭尾。 */
function rowAt(frame: LeverFrame, y: number): number {
  const row = Math.floor((y - frame.top) / rowHeight(frame));
  return Math.min(frame.last, Math.max(0, row));
}

function rowCenter(frame: LeverFrame, row: number): number {
  return frame.top + (row + 0.5) * rowHeight(frame);
}

/**
 * 拖曳時手指（已扣掉抓取偏移）在 y，桿子現在在 current：要不要換檔、換到哪一格。
 * 跨過格線再多一小段才換，手指在格線附近微抖時維持原檔；一口氣拖很遠就直接到那一格。
 */
export function dragIndex(input: LeverFrame & { y: number; current: number }): number {
  const { y, current, last } = input;
  const h = rowHeight(input);
  const slack = Math.max(h * HYSTERESIS_RATIO, HYSTERESIS_MIN_PX);
  const currentRow = last - current;
  const target = rowAt(input, y);
  if (target === currentRow) return current;
  const down = target > currentRow;
  const edge = down ? input.top + (currentRow + 1) * h + slack : input.top + currentRow * h - slack;
  const crossed = down ? y >= edge : y <= edge;
  return crossed ? last - target : current;
}

export type Grab = {
  /** true：按在握把那一格，抓住不換檔；false：按在別格或空白處，當場跳到 index。 */
  grab: boolean;
  index: number;
  /** 之後拖曳要從手指位置扣掉的偏移（手指離那一格中心多遠），拖動時握把才不會突然對齊手指。 */
  offset: number;
};

/** 按下的那一刻：按在握把那一格就抓住；按在別格或空白處就跳過去。 */
export function grabOffset(input: LeverFrame & { y: number; current: number }): Grab {
  const row = rowAt(input, input.y);
  const index = input.last - row;
  return {
    grab: index === input.current,
    index,
    offset: input.y - rowCenter(input, row),
  };
}
