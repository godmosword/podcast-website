import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, test } from "vitest";
import { pickPaletteHex } from "./reference-pick";
import { COLORING_PALETTE } from "./tools";

const LINE_INK_LUMA = 36;
/** 主要像素要貼在新色票上。webp 無損時幾乎是 0；留一點餘裕給邊緣。 */
const ON_SWATCH_DISTANCE_SQ = 64;

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else if (name === "color.webp") acc.push(path);
  }
  return acc;
}

function distanceSq(
  r: number,
  g: number,
  b: number,
  rgb: readonly [number, number, number],
): number {
  return (r - rgb[0]) ** 2 + (g - rgb[1]) ** 2 + (b - rgb[2]) ** 2;
}

function nearestIndex(r: number, g: number, b: number): { index: number; distance: number } {
  let index = 0;
  let distance = Infinity;
  COLORING_PALETTE.forEach((swatch, i) => {
    const d = distanceSq(r, g, b, [swatch.rgba[0], swatch.rgba[1], swatch.rgba[2]]);
    if (d < distance) {
      distance = d;
      index = i;
    }
  });
  return { index, distance };
}

describe("參考彩圖 color.webp", () => {
  const files = walk(join(process.cwd(), "public/coloring"));

  test("16 張彩圖的主要像素落在新色票，取色指回那一色", async () => {
    expect(files.length).toBe(16);
    for (const file of files) {
      const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const width = info.width;
      const height = info.height;
      let colored = 0;
      let onSwatch = 0;
      const sample = new Map<number, { x: number; y: number }>();

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const o = (y * width + x) * 4;
          const r = data[o]!;
          const g = data[o + 1]!;
          const b = data[o + 2]!;
          if (0.299 * r + 0.587 * g + 0.114 * b < LINE_INK_LUMA) continue;
          colored += 1;
          const nearest = nearestIndex(r, g, b);
          if (nearest.distance > ON_SWATCH_DISTANCE_SQ) continue;
          onSwatch += 1;
          if (sample.has(nearest.index) || x % 4 !== 0 || y % 4 !== 0) continue;
          if (!neighborhoodMatches(data, width, height, x, y, nearest.index)) continue;
          sample.set(nearest.index, { x, y });
        }
      }

      expect(colored, file).toBeGreaterThan(0);
      // 線條旁邊的抗鋸齒混色不強制收進色票。最低的一張約 0.90，門檻留在「主要」。
      expect(onSwatch / colored, file).toBeGreaterThanOrEqual(0.85);
      expect(sample.size, file).toBeGreaterThan(0);
      for (const [index, at] of sample) {
        expect(pickPaletteHex(new Uint8ClampedArray(data), width, height, at.x, at.y), file).toBe(
          COLORING_PALETTE[index]!.hex,
        );
      }
    }
  });
});

function neighborhoodMatches(
  data: Buffer,
  width: number,
  height: number,
  x: number,
  y: number,
  index: number,
): boolean {
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < 0 || py < 0 || px >= width || py >= height) return false;
      const o = (py * width + px) * 4;
      const nearest = nearestIndex(data[o]!, data[o + 1]!, data[o + 2]!);
      if (nearest.index !== index || nearest.distance > ON_SWATCH_DISTANCE_SQ) return false;
    }
  }
  return true;
}
