// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { BASE_FLY_MS, containedBox, flipFrom } from "./useBaseFly";

function img(rect: { left: number; top: number; width: number; height: number }, natural: [number, number]) {
  const el = document.createElement("img");
  Object.defineProperty(el, "naturalWidth", { value: natural[0] });
  Object.defineProperty(el, "naturalHeight", { value: natural[1] });
  el.getBoundingClientRect = () => ({ ...rect, right: rect.left + rect.width, bottom: rect.top + rect.height, x: rect.left, y: rect.top, toJSON: () => ({}) }) as DOMRect;
  return el;
}

describe("選飯過場的 FLIP 量法", () => {
  it("object-fit: contain：瘦長的手捲在寬框裡，只取真正畫出來的那一段（置中）", () => {
    // 手捲圖 511×986 放在 84×72 的框：高度先撐滿，寬約 37px
    const box = containedBox(img({ left: 10, top: 20, width: 84, height: 72 }, [511, 986]));
    expect(box.h).toBeCloseTo(72, 5);
    expect(box.w).toBeCloseTo((72 * 511) / 986, 5);
    expect(box.x).toBeCloseTo(10 + (84 - box.w) / 2, 5);
    expect(box.y).toBeCloseTo(20, 5);
  });

  it("圖還沒載完（沒有原始尺寸）：退回整個框", () => {
    expect(containedBox(img({ left: 1, top: 2, width: 30, height: 40 }, [0, 0]))).toEqual({ x: 1, y: 2, w: 30, h: 40 });
  });

  it("位移以中心算、縮放取比較小的比例（不變形）", () => {
    const from = { x: 0, y: 0, w: 40, h: 30 };
    const to = { x: 100, y: 50, w: 80, h: 80 };
    expect(flipFrom(from, to)).toEqual({ dx: 20 - 140, dy: 15 - 90, scale: 30 / 80 });
  });

  it("過場比連點防呆（400ms）短", () => {
    expect(BASE_FLY_MS).toBeLessThan(400);
  });
});
