import { describe, expect, it } from "vitest";
import { dragIndex, grabOffset, sliderKeyTarget } from "@/lib/games/orange-express/lever";

describe("桿子的按鍵", () => {
  it("動力桿：↑ 加一格、↓ 減一格，不超出 0 與最大格", () => {
    expect(sliderKeyTarget("power", "ArrowUp", 0, 4)).toBe(1);
    expect(sliderKeyTarget("power", "ArrowUp", 4, 4)).toBe(4);
    expect(sliderKeyTarget("power", "ArrowDown", 2, 4)).toBe(1);
    expect(sliderKeyTarget("power", "ArrowDown", 0, 4)).toBe(0);
  });

  it("Home 回 0、End 拉滿（兩根桿都是）", () => {
    expect(sliderKeyTarget("power", "Home", 3, 4)).toBe(0);
    expect(sliderKeyTarget("brake", "End", 1, 5)).toBe(5);
  });

  it("↑↓ 永遠是動力、←→ 永遠是煞車：焦點在煞車桿時方向鍵交給整頁", () => {
    for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]) {
      expect(sliderKeyTarget("brake", key, 2, 5)).toBeNull();
    }
    expect(sliderKeyTarget("power", "ArrowLeft", 1, 4)).toBeNull();
    expect(sliderKeyTarget("power", "ArrowRight", 1, 4)).toBeNull();
    expect(sliderKeyTarget("power", " ", 1, 4)).toBeNull();
  });
});

/** 五格桿、每格 40px（大司機在矮手機上大約這樣），桿頂在 y=100。 */
const five = { top: 100, height: 200, last: 4 };

describe("拖桿的格線容差", () => {
  it("手指在格線附近微抖不換檔：要跨過格線再多 10px（格高 15% 比 10px 小時取 10px）", () => {
    // 目前在 P2（由上數第 3 列，y 180–220）；格線在 y=220。
    expect(dragIndex({ ...five, y: 225, current: 2 })).toBe(2);
    expect(dragIndex({ ...five, y: 229, current: 2 })).toBe(2);
    expect(dragIndex({ ...five, y: 231, current: 2 })).toBe(1);
    expect(dragIndex({ ...five, y: 171, current: 2 })).toBe(2);
    expect(dragIndex({ ...five, y: 169, current: 2 })).toBe(3);
  });

  it("格子大的時候用格高 15%", () => {
    const three = { top: 0, height: 300, last: 2 };
    // 每格 100px，容差 15px；目前在中間那格（y 100–200）。
    expect(dragIndex({ ...three, y: 210, current: 1 })).toBe(1);
    expect(dragIndex({ ...three, y: 216, current: 1 })).toBe(0);
  });

  it("一口氣拖很遠會直接跳到那一格；超出桿面夾在頭尾", () => {
    expect(dragIndex({ ...five, y: 105, current: 0 })).toBe(4);
    expect(dragIndex({ ...five, y: 500, current: 4 })).toBe(0);
    expect(dragIndex({ ...five, y: -50, current: 0 })).toBe(4);
  });
});

describe("握把抓取偏移", () => {
  it("按在握把那一格：記下手指離握把中心多遠，不換檔", () => {
    // 目前在 P2，中心 y=200；按在 y=212（握把下緣附近）。
    expect(grabOffset({ ...five, y: 212, current: 2 })).toEqual({ grab: true, index: 2, offset: 12 });
  });

  it("按在別的格或空白處：當場跳到那一格，之後從那一格的中心算偏移", () => {
    expect(grabOffset({ ...five, y: 125, current: 2 })).toEqual({ grab: false, index: 4, offset: 5 });
  });

  it("抓著握把下緣往上拖，扣掉偏移後才算格，不會一按就跳", () => {
    const { offset } = grabOffset({ ...five, y: 212, current: 2 });
    expect(dragIndex({ ...five, y: 212 - offset, current: 2 })).toBe(2);
    expect(dragIndex({ ...five, y: 184 - offset, current: 2 })).toBe(2);
    expect(dragIndex({ ...five, y: 165 - offset, current: 2 })).toBe(3);
  });
});
