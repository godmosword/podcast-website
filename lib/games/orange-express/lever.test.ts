import { describe, expect, it } from "vitest";
import { sliderKeyTarget } from "@/lib/games/orange-express/lever";

describe("桿子的按鍵", () => {
  it("↑ 加一格、↓ 減一格，不超出 0 與最大格", () => {
    expect(sliderKeyTarget("ArrowUp", 0, 4)).toBe(1);
    expect(sliderKeyTarget("ArrowUp", 4, 4)).toBe(4);
    expect(sliderKeyTarget("ArrowDown", 2, 4)).toBe(1);
    expect(sliderKeyTarget("ArrowDown", 0, 5)).toBe(0);
  });

  it("Home 回 0、End 拉滿", () => {
    expect(sliderKeyTarget("Home", 3, 5)).toBe(0);
    expect(sliderKeyTarget("End", 1, 5)).toBe(5);
  });

  it("←→ 留給整頁的煞車對應；其他鍵也不處理", () => {
    expect(sliderKeyTarget("ArrowLeft", 1, 4)).toBeNull();
    expect(sliderKeyTarget("ArrowRight", 1, 4)).toBeNull();
    expect(sliderKeyTarget(" ", 1, 5)).toBeNull();
    expect(sliderKeyTarget("x", 1, 5)).toBeNull();
  });
});
