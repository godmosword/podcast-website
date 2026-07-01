#!/usr/bin/env tsx
/**
 * map 素材後製修補（不重新生圖、零 API 成本）：
 *  1) 透明素材去洋紅溢色（spill suppression）：消除去背邊緣的粉紅描邊。
 *  2) sea-night.png 由 sea.png 夜間調色重建：保證日/夜是「同一片水、不同光」，
 *     取代模型偶爾跑題（生成海床石頭而非夜間水面）的結果。
 *
 *   npm run fix:map-art
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/transcribe-core";

const MAP_DIR = join(ROOT, "public/adventures/map");

/** 需去溢色的透明素材（含 @2x）。 */
const TRANSPARENT_FILES = [
  "cloud-a.png",
  "cloud-b.png",
  "cloud-c.png",
  "far-island-a.png",
  "far-island-a@2x.png",
  "far-island-b.png",
  "far-island-b@2x.png",
  "sun.png",
  "moon.png",
];

/** 對已去背 PNG 逐像素去洋紅溢色：R、B 同時高於 G 者壓回 G。 */
async function despill(file: string): Promise<boolean> {
  const path = join(MAP_DIR, file);
  if (!existsSync(path)) return false;
  const { data, info } = await sharp(path)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let touched = 0;
  for (let i = 0; i < data.length; i += channels) {
    if (data[i + 3] === 0) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const spill = Math.min(r, b) - g;
    if (spill > 0) {
      data[i] = r - spill;
      data[i + 2] = b - spill;
      touched++;
    }
  }
  await sharp(data, { raw: { width, height, channels } }).png().toFile(path);
  console.log(`✓ despill ${file}（${touched} px）`);
  return true;
}

/** sea-night 由 sea 夜間調色重建：藍紫 multiply + 降亮降飽和。 */
async function rebuildNightSea(): Promise<void> {
  const day = join(MAP_DIR, "sea.png");
  const night = join(MAP_DIR, "sea-night.png");
  if (!existsSync(day)) {
    console.log("⚠ 缺 sea.png，略過 sea-night 重建");
    return;
  }
  const { width = 1024, height = 1024 } = await sharp(day).metadata();
  const tint = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 91, g: 91, b: 160 },
    },
  })
    .png()
    .toBuffer();
  await sharp(day)
    .modulate({ brightness: 0.92, saturation: 0.7 })
    .composite([{ input: tint, blend: "multiply" }])
    .png()
    .toFile(night);
  console.log("✓ 由 sea.png 重建 sea-night.png（夜間藍紫調色）");
}

async function main(): Promise<void> {
  if (!existsSync(MAP_DIR)) {
    throw new Error(`找不到 ${MAP_DIR}。請先 npm run generate:map-art 並 --approve。`);
  }
  for (const file of TRANSPARENT_FILES) await despill(file);
  await rebuildNightSea();
  console.log("完成。重看 /adventures 夜間海面與去背邊緣。");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
