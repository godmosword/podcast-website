#!/usr/bin/env tsx
/**
 * W27-3：森林島底緣 magenta 暈圈修復（一次性後製，不重跑生圖）。
 *
 * 生圖 chroma-key 只去飽和 magenta（r>200 && g<80 && b>200），抗鋸齒混色像素
 * 被烘進 forest{,@2x,@3x}.png/webp。修法：
 *   1. boundary flood（scripts/lib/roamer-alpha.ts）用 magenta predicate
 *      清除與邊界（含透明 rim）連通的洋紅 fringe——內部合法粉紫（小花）不受影響。
 *   2. despill（scripts/lib/zone-fringe.ts）：貼透明邊或半透明的殘餘偏洋紅像素，
 *      R/B 夾向 G，讓剩餘暈邊讀成中性色。
 *   3. 重產同名 webp（quality 82，同 generate-forest-zone-art.ts）。
 *
 *   npm run fix:forest-zone
 */

import { join } from "node:path";
import sharp from "sharp";
import { floodBorderBackground } from "./lib/roamer-alpha";
import { despillMagentaEdges, isMagentaFringe } from "./lib/zone-fringe";
import { ROOT } from "./lib/transcribe-core";

const ZONE_DIR = join(ROOT, "public/adventures/zones");
const FILES = ["forest.png", "forest@2x.png", "forest@3x.png"];

async function fixFile(name: string): Promise<void> {
  const path = join(ZONE_DIR, name);
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;

  const { removed } = floodBorderBackground(data, w, h, c, isMagentaFringe);
  let cleared = 0;
  for (let p = 0; p < w * h; p++) {
    if (removed[p] && data[p * c + 3]! > 0) {
      data[p * c + 3] = 0;
      cleared++;
    }
  }
  const despilled = despillMagentaEdges(data, w, h, c);

  await sharp(data, { raw: { width: w, height: h, channels: c } })
    .png()
    .toFile(path);
  await sharp(path)
    .webp({ quality: 82 })
    .toFile(path.replace(/\.png$/, ".webp"));
  console.log(`✓ ${name}：flood 去除 ${cleared} px、despill ${despilled} px，PNG + webp 已更新`);
}

async function main(): Promise<void> {
  for (const name of FILES) {
    await fixFile(name);
  }
  console.log("✓ forest 島 magenta 暈圈修復完成（W27-3）");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
