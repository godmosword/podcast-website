import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CUSTOMERS } from "./customers";

const DIR = join(process.cwd(), "public/games/v2/dino-sushi/customers");
/** 跟 duoduo-sticker 的 STICKER_GROUND 同一條線。 */
const BASELINE = 942;

describe("客人全身貼紙", () => {
  it("六張都是 1024 透明圖，輪底落在畫布 92%，車身寬跟多多同一級", async () => {
    const problems: string[] = [];
    for (const customer of CUSTOMERS) {
      const file = join(DIR, `${customer.id}.webp`);
      const { data, info } = await sharp(readFileSync(file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      if (info.width !== 1024 || info.height !== 1024) problems.push(`${customer.id} ${info.width}×${info.height}`);
      if (!info.channels || info.channels < 4) problems.push(`${customer.id} 沒有透明`);
      let minX = info.width;
      let maxX = 0;
      let maxY = 0;
      let opaque = 0;
      for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
          if (data[(y * info.width + x) * 4 + 3]! <= 24) continue;
          opaque++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (opaque < 1000) problems.push(`${customer.id} 幾乎全透明`);
      if (Math.abs(maxY + 1 - BASELINE) > 2) problems.push(`${customer.id} 輪底 y=${maxY + 1}`);
      const width = maxX - minX + 1;
      if (width < 800) problems.push(`${customer.id} 車身寬 ${width}，應接近多多`);
      if (minX < 24 || maxX > 1000) problems.push(`${customer.id} 貼到畫布邊緣`);
    }
    expect(problems).toEqual([]);
  });
});