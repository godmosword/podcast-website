import { describe, expect, it } from "vitest";
import { emptyDayFlags, nextDayAfter } from "./day-progress";

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
