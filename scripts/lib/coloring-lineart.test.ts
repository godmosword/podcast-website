import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import sharp from "sharp";
import {
  COLORING_LINEART_MAX_SIDE,
  convertToLineArt,
  isMostlyWhiteBackground,
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
});
