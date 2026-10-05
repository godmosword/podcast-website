import { expect, test } from "vitest";
import { ColoringRegions } from "./regions";
import { hasColoringPaint } from "./bitmap";
test("black-line seed snaps to one region and reuses its cached mask", () => {
  const data = new Uint8ClampedArray(7 * 7 * 4).fill(255);
  for (let y = 0; y < 7; y++) {
    const i = (y * 7 + 3) * 4;
    data[i] = data[i + 1] = data[i + 2] = 0;
  }
  const regions = new ColoringRegions(data, 7, 7);
  const mask = regions.resolve(3, 3, 1)!;
  expect(mask[3 * 7 + 2]).toBe(1);
  expect(mask[3 * 7 + 4]).toBe(0);
  expect(regions.resolve(2, 3)).toBe(mask);
  expect(regions.resolve(-1, 0)).toBeNull();
});
test("a fully black intersection does not paint through neighboring lines", () => {
  const r = new ColoringRegions(new Uint8ClampedArray(9 * 9 * 4), 9, 9);
  expect(r.resolve(4, 4, 2)).toBeNull();
});
test("empty, erased, and restored pixels determine completion", () => {
  const pixels = new Uint8ClampedArray(16);
  expect(hasColoringPaint(pixels)).toBe(false);
  pixels[3] = 255;
  expect(hasColoringPaint(pixels)).toBe(true);
  pixels[3] = 0;
  expect(hasColoringPaint(pixels)).toBe(false);
});
