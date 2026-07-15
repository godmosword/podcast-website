import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import sharp from "sharp";
import {
  COLORING_BUCKET_LEAK_MAX,
  COLORING_LINEART_MAX_SIDE,
  convertToLineArt,
  estimateBucketLeakRatio,
  isMostlyWhiteBackground,
  subjectOutlineFromRgba,
} from "./coloring-lineart";

const SAMPLE = join(process.cwd(), "public/characters/恐龍車多多.jpg");

describe("coloring-lineart converter", () => {
  test("產出白底黑線 PNG，長邊不大於上限", async () => {
    const input = readFileSync(SAMPLE);
    const result = await convertToLineArt(input);

    expect(result.width).toBeLessThanOrEqual(COLORING_LINEART_MAX_SIDE);
    expect(result.height).toBeLessThanOrEqual(COLORING_LINEART_MAX_SIDE);
    expect(result.buffer.byteLength).toBeGreaterThan(500);

    const meta = await sharp(result.buffer).metadata();
    expect(meta.format).toBe("png");
    expect(await isMostlyWhiteBackground(result.buffer)).toBe(true);
  });

  test("恐龍車多多線稿外框可填比低於漏色門檻", async () => {
    const input = readFileSync(SAMPLE);
    const result = await convertToLineArt(input);
    const leak = await estimateBucketLeakRatio(result.buffer);
    expect(leak).toBeLessThan(COLORING_BUCKET_LEAK_MAX);
  });

  test("subjectOutlineFromRgba 對實心圓產生閉合輪廓", () => {
    const w = 64;
    const h = 64;
    const data = Buffer.alloc(w * h * 4, 200); // 灰背景
    const cx = 32;
    const cy = 32;
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= 14 * 14) {
          const i = (y * w + x) * 4;
          data[i] = 220;
          data[i + 1] = 40;
          data[i + 2] = 40;
          data[i + 3] = 255;
        }
      }
    }
    const outline = subjectOutlineFromRgba(data, w, h, 4, 24);
    let ink = 0;
    for (const v of outline) if (v) ink += 1;
    expect(ink).toBeGreaterThan(40);
    // 圓心不應落在輪廓上
    expect(outline[cy * w + cx]).toBe(0);
  });
});
