import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { COVER_TARGET_PX, normalizeCoverImage } from "./cover-image";

describe("normalizeCoverImage", () => {
  it("輸出 1400×1400 JPEG", async () => {
    const wide = await sharp({
      create: {
        width: 2000,
        height: 1000,
        channels: 3,
        background: { r: 200, g: 50, b: 50 },
      },
    })
      .jpeg()
      .toBuffer();

    const out = await normalizeCoverImage(wide);
    const meta = await sharp(out).metadata();
    expect(meta.width).toBe(COVER_TARGET_PX);
    expect(meta.height).toBe(COVER_TARGET_PX);
    expect(meta.format).toBe("jpeg");
  });

  it("橫圖以 contain 保留完整內容（上下留白）", async () => {
    const wide = await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();

    const out = await normalizeCoverImage(wide);
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    const topR = data[0];
    const topG = data[1];
    const topB = data[2];
    const centerY = Math.floor(info.height / 2);
    const centerIdx = (centerY * info.width + Math.floor(info.width / 2)) * 3;
    const centerR = data[centerIdx];
    // 頂部應為白底留白，中央紅色通道明顯高於頂部
    expect(topR).toBeGreaterThan(250);
    expect(topG).toBeGreaterThan(250);
    expect(topB).toBeGreaterThan(250);
    expect(centerR).toBeGreaterThan(200);
  });
});
