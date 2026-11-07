import { describe, expect, it } from "vitest";
import { emptyDayFlags, mergeDayFlags, nextDayAfter, withDayFlags } from "./day-progress";

const cleared = (...days: number[]) => {
  const flags = emptyDayFlags();
  return flags.map((value, i) => (days.includes(i + 1) ? 1 : value));
};

describe("nextDayAfter：結算的主鈕要不要前進", () => {
  it("第 1–3 天通關，下一天還沒通關：前進", () => {
    expect(nextDayAfter(1, cleared(1), 0)).toBe(2);
    expect(nextDayAfter(2, cleared(1, 2), 0)).toBe(3);
    expect(nextDayAfter(3, cleared(1, 2, 3), 0)).toBe(4);
  });

  it("第 4 天是目前最後一天：沒有下一天（第 5 天資料上開著也一樣）", () => {
    expect(nextDayAfter(4, cleared(1, 2, 3), 1)).toBeNull();
  });

  it("重玩舊的天、下一天已經通關：留在重玩", () => {
    expect(nextDayAfter(1, cleared(1, 2), 0)).toBeNull();
    // 第 4 天的通關記在舊獎牌，不在 dinoSushiDays
    expect(nextDayAfter(3, cleared(1, 2, 3), 1)).toBeNull();
  });

  it("舊存檔第 4 天已通關：第 1 天玩完往第 2 天走，不跳過", () => {
    expect(nextDayAfter(1, cleared(1), 1)).toBe(2);
  });

  it("自由做沒有天數：不前進", () => {
    expect(nextDayAfter(0, emptyDayFlags(), 0)).toBeNull();
  });
});

describe("withDayFlags：把這一輪的星星加進那一天", () => {
  it("只加不減，回傳新陣列、不動原本的", () => {
    const days = withDayFlags(emptyDayFlags(), 1, 1);
    const more = withDayFlags(days, 1, 6);
    expect(days[0]).toBe(1);
    expect(more[0]).toBe(7);
    expect(withDayFlags(more, 1, 1)[0]).toBe(7);
  });

  it("第 4 天走舊獎牌、範圍外的天都不寫", () => {
    const empty = emptyDayFlags();
    expect(withDayFlags(empty, 4, 7)).toEqual(empty);
    expect(withDayFlags(empty, 0, 7)).toEqual(empty);
    expect(withDayFlags(empty, 9, 7)).toEqual(empty);
  });
});

describe("mergeDayFlags：存檔和還沒寫進去的合起來", () => {
  it("逐天 OR；舊存檔長度不對也不會丟掉另一邊", () => {
    const left = withDayFlags(emptyDayFlags(), 1, 1);
    const right = withDayFlags(withDayFlags(emptyDayFlags(), 1, 2), 2, 1);
    expect(mergeDayFlags(left, right).slice(0, 2)).toEqual([3, 1]);
    expect(mergeDayFlags([], right).slice(0, 2)).toEqual([2, 1]);
  });
});
