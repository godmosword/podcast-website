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
test("a thick intersection chooses the nearest white pixel by distance", () => {
  const data = new Uint8ClampedArray(12 * 12 * 4);
  for (const [x, y] of [[9, 9], [10, 5]])
    data.fill(255, (y! * 12 + x!) * 4, (y! * 12 + x!) * 4 + 4);
  const mask = new ColoringRegions(data, 12, 12).resolve(5, 5, 6)!;
  expect(mask[5 * 12 + 10]).toBe(1);
  expect(mask[9 * 12 + 9]).toBe(0);
});
test("edge and one-pixel regions remain isolated and the ninth mask evicts the oldest", () => {
  const data = new Uint8ClampedArray(5 * 19 * 4);
  for (let y = 0; y < 19; y += 2)
    data.fill(255, y * 5 * 4, (y + 1) * 5 * 4);
  const regions = new ColoringRegions(data, 5, 19);
  const first = regions.resolve(0, 0)!;
  expect(first[0]).toBe(1);
  expect(first[5]).toBe(0);
  for (let y = 2; y <= 16; y += 2) regions.resolve(0, y);
  expect(regions.resolve(0, 0)).not.toBe(first);
});
