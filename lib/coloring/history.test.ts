import { describe, expect, test } from "vitest";
import { ColoringHistory, type ColoringPatch } from "./history";
const patch = (n: number): ColoringPatch => ({
  rect: { x: 0, y: 0, width: 1, height: 1 },
  pixels: new Uint8ClampedArray([n, 0, 0, 255]),
});
describe("coloring patch history", () => {
  test("undo/redo preserve order and a new stroke discards redo", () => {
    const h = new ColoringHistory();
    h.push(patch(1));
    h.push(patch(2));
    expect(h.take("undo", () => patch(3))?.pixels[0]).toBe(2);
    expect(h.take("redo", () => patch(2))?.pixels[0]).toBe(3);
    h.take("undo", () => patch(3));
    h.push(patch(4));
    expect(h.redo).toHaveLength(0);
  });
  test("both stacks share a byte budget", () => {
    const h = new ColoringHistory(8);
    h.push(patch(1));
    h.push(patch(2));
    h.push(patch(3));
    expect(h.undo.map((p) => p.pixels[0])).toEqual([2, 3]);
    h.take("undo", () => patch(4));
    expect(h.bytes).toBe(8);
    h.clear();
    expect(h.bytes).toBe(0);
  });
  test("long drawing sessions retain only the allowed steps and bytes", () => {
    const h = new ColoringHistory(12, 2);
    for (let i = 0; i < 1000; i++) {
      h.push(patch(i % 255));
      h.take("undo", () => patch(1));
      expect(h.bytes).toBeLessThanOrEqual(12);
      expect(h.undo.length + h.redo.length).toBeLessThanOrEqual(2);
      h.take("redo", () => patch(2));
    }
    expect(h.undo).toHaveLength(2);
    h.push({ rect: { x: 0, y: 0, width: 4, height: 1 }, pixels: new Uint8ClampedArray(16) });
    expect(h.bytes).toBe(0);
  });
});
