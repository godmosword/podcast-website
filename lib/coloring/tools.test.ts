import { describe, expect, test } from "vitest";
import {
  COLORING_PALETTE,
  coloringDraftKey,
  floodFillPaint,
  hexToRgba,
  stampBrush,
} from "@/lib/coloring/tools";

function makeImageData(
  width: number,
  height: number,
  fill: [number, number, number, number] = [255, 255, 255, 255],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3];
  }
  return { data, width, height, colorSpace: "srgb" } as ImageData;
}

describe("coloring tools", () => {
  test("色盤至少 10 色且 hex 可轉 rgba", () => {
    expect(COLORING_PALETTE.length).toBeGreaterThanOrEqual(10);
    expect(hexToRgba("#ff0000")).toEqual([255, 0, 0, 255]);
    expect(COLORING_PALETTE[0]?.rgba[3]).toBe(255);
  });

  test("draft key 使用 coloring:v1 前綴", () => {
    expect(coloringDraftKey("char-小紅賽車")).toBe("coloring:v1:char-小紅賽車");
  });

  test("floodFillPaint 填滿開放區域並停在黑線", () => {
    const paint = makeImageData(5, 5);
    const line = new Uint8ClampedArray(5 * 5 * 4);
    // 中間垂直黑牆 x=2
    for (let y = 0; y < 5; y += 1) {
      for (let x = 0; x < 5; x += 1) {
        const i = (y * 5 + x) * 4;
        const dark = x === 2;
        line[i] = dark ? 0 : 255;
        line[i + 1] = dark ? 0 : 255;
        line[i + 2] = dark ? 0 : 255;
        line[i + 3] = 255;
      }
    }

    const filled = floodFillPaint(paint, 0, 2, [255, 0, 0, 255], line);
    expect(filled).toBe(10); // 左半 5×2
    // 右側仍白
    expect(paint.data[(2 * 5 + 4) * 4]).toBe(255);
    // 左側變紅
    expect(paint.data[(2 * 5 + 0) * 4]).toBe(255);
    expect(paint.data[(2 * 5 + 0) * 4 + 1]).toBe(0);
  });

  test("stampBrush 畫圓且不蓋黑線", () => {
    const paint = makeImageData(7, 7, [255, 255, 255, 0]);
    const line = new Uint8ClampedArray(7 * 7 * 4);
    line.fill(255);
    // 中心為黑線
    const mid = (3 * 7 + 3) * 4;
    line[mid] = 0;
    line[mid + 1] = 0;
    line[mid + 2] = 0;

    stampBrush(paint, 3, 3, 2, [0, 0, 255, 255], line);
    expect(paint.data[mid + 3]).toBe(0); // 線上未塗
    expect(paint.data[((3 * 7 + 4) * 4) + 2]).toBe(255); // 旁側藍
  });
});
