import { describe, expect, it } from "vitest";
import { freshColumns, freshLayout } from "./fresh-layout";

describe("結算新貼紙格", () => {
  it("放得下就全部放，不出「+N」", () => {
    expect(freshLayout(4, 5, 1)).toEqual({ shown: 4, more: 0 });
    expect(freshLayout(5, 5, 1)).toEqual({ shown: 5, more: 0 });
    expect(freshLayout(16, 8, 2)).toEqual({ shown: 16, more: 0 });
    expect(freshLayout(0, 5, 2)).toEqual({ shown: 0, more: 0 });
  });

  it("放不下時最後一格換成「+N」，N＝沒露出來的張數", () => {
    expect(freshLayout(16, 5, 2)).toEqual({ shown: 9, more: 7 });
    expect(freshLayout(6, 5, 1)).toEqual({ shown: 4, more: 2 });
    expect(freshLayout(17, 8, 2)).toEqual({ shown: 15, more: 2 });
  });

  it("只放得下一格時只剩「+N」", () => {
    expect(freshLayout(3, 1, 1)).toEqual({ shown: 0, more: 3 });
  });

  it("欄數、列數小於 1 或不是整數時當 1、往下取整", () => {
    expect(freshLayout(2, 0, 0)).toEqual({ shown: 0, more: 2 });
    expect(freshLayout(10, 5.9, 2.4)).toEqual({ shown: 10, more: 0 });
    expect(freshLayout(11, 5.9, 2.4)).toEqual({ shown: 9, more: 2 });
  });

  it("欄數由寬度、格子與間距算：312px 放 5 張 56px（間距 8）", () => {
    expect(freshColumns(312, 56, 8)).toBe(5);
    expect(freshColumns(311, 56, 8)).toBe(4);
    expect(freshColumns(504, 56, 8)).toBe(8);
    expect(freshColumns(0, 56, 8)).toBe(1);
    expect(freshColumns(312, 0, 8)).toBe(1);
  });
});
