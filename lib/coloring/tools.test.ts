import { describe, expect, test } from "vitest";
import {
  BRUSH_SIZES,
  COLORING_PALETTE,
  coloringDraftKey,
  cropImageDataRect,
  floodFillPaint,
  hexToRgba,
  pasteImageDataRect,
  stampBrush,
  unionDirtyRect,
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

function makeLine(width: number, height: number, isDark: (x: number, y: number) => boolean) {
  const line = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const v = isDark(x, y) ? 0 : 255;
      line[i] = v;
      line[i + 1] = v;
      line[i + 2] = v;
      line[i + 3] = 255;
    }
  }
  return line;
}

describe("coloring tools", () => {
  test("色盤至少 10 色且 hex 可轉 rgba", () => {
    expect(COLORING_PALETTE.length).toBeGreaterThanOrEqual(10);
    expect(hexToRgba("#ff0000")).toEqual([255, 0, 0, 255]);
    expect(COLORING_PALETTE[0]?.rgba[3]).toBe(255);
  });

  test("筆刷三檔由細到粗", () => {
    expect(BRUSH_SIZES.length).toBe(3);
    const radii = BRUSH_SIZES.map((s) => s.displayRadius);
    expect([...radii].sort((a, b) => a - b)).toEqual(radii);
  });

  test("draft key 使用 coloring:v1 前綴", () => {
    expect(coloringDraftKey("char-小紅賽車")).toBe("coloring:v1:char-小紅賽車");
  });

  test("floodFillPaint 填滿開放區域並停在黑線，回傳 dirty rect", () => {
    const paint = makeImageData(5, 5);
    // 中間垂直黑牆 x=2
    const line = makeLine(5, 5, (x) => x === 2);

    const { filled, rect } = floodFillPaint(paint, 0, 2, [255, 0, 0, 255], line);
    expect(filled).toBe(10); // 左半 5×2
    // 右側仍白
    expect(paint.data[(2 * 5 + 4) * 4]).toBe(255);
    expect(paint.data[(2 * 5 + 4) * 4 + 1]).toBe(255);
    // 左側變紅
    expect(paint.data[(2 * 5 + 0) * 4]).toBe(255);
    expect(paint.data[(2 * 5 + 0) * 4 + 1]).toBe(0);
    // dirty rect 涵蓋左半與滲入牆的範圍（x 0..2）
    expect(rect).toEqual({ x: 0, y: 0, width: 3, height: 5 });
  });

  test("floodFillPaint 顏色滲入暗線內側，消除白縫", () => {
    const paint = makeImageData(7, 3);
    // x=3 為黑線
    const line = makeLine(7, 3, (x) => x === 3);

    floodFillPaint(paint, 0, 1, [0, 0, 255, 255], line);
    // 線上（x=3）也被滲入藍色（multiply 疊線後不可見，但消除縫隙）
    expect(paint.data[(1 * 7 + 3) * 4]).toBe(0);
    expect(paint.data[(1 * 7 + 3) * 4 + 2]).toBe(255);
    // 線右側（x=4）不受影響——滲入不穿牆擴散（仍為白 r=255）
    expect(paint.data[(1 * 7 + 4) * 4]).toBe(255);
  });

  test("floodFillPaint 點在線上不動作", () => {
    const paint = makeImageData(5, 5);
    const line = makeLine(5, 5, (x) => x === 2);
    const { filled, rect } = floodFillPaint(paint, 2, 2, [255, 0, 0, 255], line);
    expect(filled).toBe(0);
    expect(rect).toBeNull();
    // 線周圍不得被滲入
    expect(paint.data[(2 * 5 + 2) * 4 + 1]).toBe(255);
  });

  test("stampBrush 畫圓且不蓋黑線，回傳 dirty rect", () => {
    const paint = makeImageData(7, 7, [255, 255, 255, 0]);
    const line = makeLine(7, 7, (x, y) => x === 3 && y === 3);
    const mid = (3 * 7 + 3) * 4;

    const rect = stampBrush(paint, 3, 3, 2, [0, 0, 255, 255], line);
    expect(paint.data[mid + 3]).toBe(0); // 線上未塗
    expect(paint.data[((3 * 7 + 4) * 4) + 3]).toBe(255); // 旁側已塗（alpha 由 0 → 255）
    expect(paint.data[((3 * 7 + 4) * 4) + 2]).toBe(255); // 旁側藍
    expect(rect).toEqual({ x: 1, y: 1, width: 5, height: 5 });
  });

  test("unionDirtyRect 合併與 null 傳遞", () => {
    expect(unionDirtyRect(null, null)).toBeNull();
    const a = { x: 1, y: 1, width: 2, height: 2 };
    expect(unionDirtyRect(a, null)).toEqual(a);
    expect(
      unionDirtyRect(a, { x: 4, y: 0, width: 2, height: 2 }),
    ).toEqual({ x: 1, y: 0, width: 5, height: 3 });
  });

  test("crop / paste dirty rect 可還原原始像素（undo 補丁）", () => {
    const img = makeImageData(4, 4);
    const rect = { x: 1, y: 1, width: 2, height: 2 };
    const before = cropImageDataRect(img, rect);
    expect(before.length).toBe(2 * 2 * 4);

    stampBrush(img, 2, 2, 1, [10, 20, 30, 255]);
    expect(img.data[(2 * 4 + 2) * 4]).toBe(10);

    pasteImageDataRect(img, before, rect);
    expect(img.data[(2 * 4 + 2) * 4]).toBe(255);
    expect(img.data[(1 * 4 + 1) * 4 + 3]).toBe(255);
  });
});
