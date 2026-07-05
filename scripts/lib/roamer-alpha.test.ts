import { describe, expect, it } from "vitest";
import { applyBackgroundRemoval, floodBorderBackground } from "./roamer-alpha";

/** 建一張 raw RGBA：近白底 + 中央彩色方塊（內含一塊白「內部白」）。 */
function makeImage(w: number, h: number): Uint8Array {
  const c = 4;
  const data = new Uint8Array(w * h * c);
  const set = (x: number, y: number, r: number, g: number, b: number, a: number) => {
    const i = (y * w + x) * c;
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) set(x, y, 245, 245, 245, 255); // 近白底
  }
  // 中央綠色方塊（彩色黏土，不該被去掉）
  for (let y = 6; y < 14; y++) {
    for (let x = 6; x < 14; x++) set(x, y, 60, 180, 60, 255);
  }
  // 方塊內部一塊白（被綠包圍 → flood 進不來，應保留）
  for (let y = 9; y < 11; y++) {
    for (let x = 9; x < 11; x++) set(x, y, 255, 255, 255, 255);
  }
  return data;
}

describe("floodBorderBackground", () => {
  const W = 20;
  const H = 20;

  it("移除邊界相連近白底，保留彩色方塊與內部白", () => {
    const data = makeImage(W, H);
    const { removed, bgPct } = floodBorderBackground(data, W, H, 4);
    // 背景占多數
    expect(bgPct).toBeGreaterThan(50);
    // 角落（背景）被標記移除
    expect(removed[0]).toBe(1);
    // 綠方塊中心不移除
    expect(removed[10 * W + 7]).toBe(0);
    // 內部白（被綠包圍）不移除
    expect(removed[10 * W + 10]).toBe(0);
  });

  it("自訂 isBg predicate：移除邊界相連 magenta 環，保留內部彩色與內部 magenta", () => {
    const c = 4;
    const data = new Uint8Array(W * H * c);
    const set = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const i = (y * W + x) * c;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    };
    // 全圖透明 rim（flood 可穿越）
    // 中央綠色方塊，外圈一層 magenta fringe（貼著透明 rim）
    for (let y = 5; y < 15; y++) {
      for (let x = 5; x < 15; x++) set(x, y, 230, 60, 220, 255); // magenta 環
    }
    for (let y = 6; y < 14; y++) {
      for (let x = 6; x < 14; x++) set(x, y, 60, 180, 60, 255); // 綠色本體
    }
    // 本體內一點 magenta（合法粉紫內容，被綠包圍 → 應保留）
    set(10, 10, 230, 60, 220, 255);

    const isMagenta = (r: number, g: number, b: number) => r - g > 60 && b - g > 60;
    const { removed } = floodBorderBackground(data, W, H, 4, isMagenta);
    // fringe 環（透過透明 rim 與邊界連通）被標記
    expect(removed[5 * W + 5]).toBe(1);
    expect(removed[14 * W + 10]).toBe(1);
    // 綠色本體與內部 magenta 保留
    expect(removed[7 * W + 7]).toBe(0);
    expect(removed[10 * W + 10]).toBe(0);
    // 近白預設判定不受影響：透明 rim 不算 removed
    expect(removed[0]).toBe(0);
  });

  it("applyBackgroundRemoval 把背景設透明、保留內部像素不透明", () => {
    const data = makeImage(W, H);
    const { removed } = floodBorderBackground(data, W, H, 4);
    applyBackgroundRemoval(data, W, H, 4, removed);
    const alphaAt = (x: number, y: number) => data[(y * W + x) * 4 + 3];
    expect(alphaAt(0, 0)).toBe(0); // 背景透明
    expect(alphaAt(7, 10)).toBe(255); // 綠方塊不透明
    expect(alphaAt(10, 10)).toBe(255); // 內部白不透明
  });
});
