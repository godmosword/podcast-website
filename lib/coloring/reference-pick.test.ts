import { describe, expect, test } from "vitest";
import { paletteName, pickPaletteHex } from "./reference-pick";

const W = 10;

/** 左半淡天藍（略偏）、第 5 欄黑線、右半粉彩紅。 */
function image(): Uint8ClampedArray {
  const data = new Uint8ClampedArray(W * W * 4);
  for (let p = 0; p < W * W; p++) {
    const x = p % W;
    const rgb = x < 5 ? [170, 210, 228] : x === 5 ? [0, 0, 0] : [220, 160, 150];
    data.set([...rgb, 255], p * 4);
  }
  return data;
}

describe("pickPaletteHex", () => {
  test("取到最接近的色盤色", () => {
    expect(pickPaletteHex(image(), W, W, 1, 5)).toBe("#b7d9ea");
    expect(pickPaletteHex(image(), W, W, 8, 5)).toBe("#e7a8a0");
  });

  test("點在線上時看旁邊的顏色，不回黑色", () => {
    expect(pickPaletteHex(image(), W, W, 5, 5)).not.toBe("#3a342e");
  });

  test("整片都是線時回 null", () => {
    const ink = new Uint8ClampedArray(W * W * 4).fill(0);
    expect(pickPaletteHex(ink, W, W, 5, 5)).toBeNull();
  });

  test("超出邊界的點仍可取到鄰近色", () => {
    expect(pickPaletteHex(image(), W, W, -1, -1)).toBe("#b7d9ea");
  });
});

describe("paletteName", () => {
  test("色盤色回中文名，其他回通稱", () => {
    expect(paletteName("#F7E6AE")).toBe("黃色");
    expect(paletteName("#123456")).toBe("這個顏色");
  });
});
