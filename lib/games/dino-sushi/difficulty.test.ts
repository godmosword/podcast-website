import { describe, expect, it } from "vitest";
import {
  BASE_IDLE_HINT_MS,
  idleHintMs,
  nextTier,
  startTier,
  teachesFirstOrder,
  TIER_SIZES,
  type OrderTier,
} from "./difficulty";
import { ORDER_SIZES } from "./orders";

describe("難度檔位（自動調整，不加選單）", () => {
  it("三檔料數：一般檔就是原本的 1、1、2、2、3；每檔都是 5 單、由少到多", () => {
    expect(TIER_SIZES.normal).toEqual(ORDER_SIZES);
    expect(TIER_SIZES.easy).toEqual([1, 1, 1, 2, 2]);
    expect(TIER_SIZES.advanced).toEqual([2, 2, 3, 3, 3]);
    for (const sizes of Object.values(TIER_SIZES)) {
      expect(sizes).toHaveLength(5);
      expect([...sizes].sort((a, b) => a - b)).toEqual(sizes);
      for (const n of sizes) expect(n).toBeGreaterThanOrEqual(1);
      for (const n of sizes) expect(n).toBeLessThanOrEqual(3);
    }
  });

  it("起始檔沿用既有存檔：拿過 3 星從進階開始，否則一般", () => {
    expect(startTier(0)).toBe("normal");
    expect(startTier(2)).toBe("normal");
    expect(startTier(3)).toBe("advanced");
  });

  it("一輪 5 單都一次做對升一檔、一次做對 ≤2 單降一檔，其他不變；到頂到底不再動", () => {
    const cases: [OrderTier, number, OrderTier][] = [
      ["normal", 5, "advanced"],
      ["easy", 5, "normal"],
      ["advanced", 5, "advanced"],
      ["normal", 2, "easy"],
      ["advanced", 0, "normal"],
      ["easy", 0, "easy"],
      ["normal", 3, "normal"],
      ["normal", 4, "normal"],
    ];
    for (const [from, firstTries, to] of cases) expect(nextTier(from, firstTries), `${from} ${firstTries}`).toBe(to);
  });

  it("進階：閒置提示等 7 秒、不出首單教學手指；其他檔照舊", () => {
    expect(idleHintMs("advanced")).toBe(7000);
    expect(BASE_IDLE_HINT_MS).toBe(4500);
    expect(idleHintMs("normal")).toBe(BASE_IDLE_HINT_MS);
    expect(idleHintMs("easy")).toBe(BASE_IDLE_HINT_MS);
    expect(teachesFirstOrder("advanced")).toBe(false);
    expect(teachesFirstOrder("normal")).toBe(true);
    expect(teachesFirstOrder("easy")).toBe(true);
  });
});
