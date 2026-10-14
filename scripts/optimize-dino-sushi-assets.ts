#!/usr/bin/env tsx
/**
 * 多多壽司屋素材 → 同目錄 `sm/` 縮小副本（原檔不動）。
 * 寬度表在 lib/games/dino-sushi/asset-src.ts；版面改了要先重量、改表再重跑。
 *
 *   npm run optimize:dino-sushi-assets
 *   npm run optimize:dino-sushi-assets -- --verify
 */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import {
  DINO_SUSHI_ASSET_ROOT,
  DINO_SUSHI_SM_WIDTH,
  dinoSushiSmPath,
  type DinoSushiAsset,
} from "../lib/games/dino-sushi/asset-src";
import { ROOT } from "./lib/transcribe-core";

const PUBLIC_ROOT = join(ROOT, "public", DINO_SUSHI_ASSET_ROOT);
const SM_DIRS = ["duoduo", "food", "shop"] as const;
/** 黏土質感在 86 以下會開始糊；透明邊緣保留滿品質，疊在舞台上才不會有毛邊。 */
const WEBP_OPTIONS = { quality: 86, alphaQuality: 100, effort: 6 } as const;

const ASSETS = Object.keys(DINO_SUSHI_SM_WIDTH) as DinoSushiAsset[];

function kb(bytes: number): string {
  return `${Math.round(bytes / 1024)}KB`;
}

async function writeCopy(asset: DinoSushiAsset): Promise<void> {
  const original = join(PUBLIC_ROOT, asset);
  const copy = join(PUBLIC_ROOT, dinoSushiSmPath(asset));
  if (!existsSync(original)) throw new Error(`找不到原檔：${asset}`);
  mkdirSync(dirname(copy), { recursive: true });

  const target = DINO_SUSHI_SM_WIDTH[asset];
  const { width } = await sharp(original).metadata();
  if (target === null || !width || target >= width) {
    copyFileSync(original, copy);
    console.log(`= ${asset}（原尺寸照抄）`);
    return;
  }
  await sharp(original).resize({ width: target }).webp(WEBP_OPTIONS).toFile(copy);
  console.log(`✓ ${asset} ${width} → ${target}  ${kb(statSync(original).size)} → ${kb(statSync(copy).size)}`);
}

async function verify(): Promise<void> {
  const problems: string[] = [];
  let before = 0;
  let after = 0;
  for (const asset of ASSETS) {
    const original = join(PUBLIC_ROOT, asset);
    const copy = join(PUBLIC_ROOT, dinoSushiSmPath(asset));
    if (!existsSync(original)) {
      problems.push(`缺原檔 ${asset}`);
      continue;
    }
    if (!existsSync(copy)) {
      problems.push(`缺副本 ${dinoSushiSmPath(asset)}`);
      continue;
    }
    const [orig, sm] = await Promise.all([sharp(original).metadata(), sharp(copy).metadata()]);
    const expected = Math.min(DINO_SUSHI_SM_WIDTH[asset] ?? orig.width!, orig.width!);
    if (sm.width !== expected) problems.push(`${asset} 副本寬 ${sm.width}，應為 ${expected}`);
    // 長寬比或位元對不上＝原檔換過圖、副本沒重產
    if (Math.abs(sm.height! - (orig.height! * sm.width!) / orig.width!) > 1) {
      problems.push(`${asset} 副本長寬比跟原檔不同，重跑腳本`);
    }
    if (expected === orig.width && !readFileSync(copy).equals(readFileSync(original))) {
      problems.push(`${asset} 原尺寸副本跟原檔不一樣，重跑腳本`);
    }
    if (orig.hasAlpha && !sm.hasAlpha) problems.push(`${asset} 副本掉了透明`);
    const origBytes = statSync(original).size;
    const smBytes = statSync(copy).size;
    if (smBytes > origBytes) problems.push(`${asset} 副本 ${kb(smBytes)} 比原檔 ${kb(origBytes)} 大`);
    before += origBytes;
    after += smBytes;
  }

  const expected = new Set(ASSETS.map(dinoSushiSmPath));
  for (const dir of SM_DIRS) {
    const smDir = join(PUBLIC_ROOT, dir, "sm");
    if (!existsSync(smDir)) continue;
    for (const name of readdirSync(smDir)) {
      if (!expected.has(`${dir}/sm/${name}`)) problems.push(`多出來的副本 ${dir}/sm/${name}`);
    }
  }

  console.log(`${ASSETS.length} 張：原檔 ${kb(before)} → 副本 ${kb(after)}`);
  if (problems.length > 0) {
    for (const p of problems) console.log(`✗ ${p}`);
    process.exit(1);
  }
  console.log("✓ 副本齊全、寬度正確");
}

async function main(): Promise<void> {
  if (process.argv.includes("--verify")) {
    await verify();
    return;
  }
  for (const asset of ASSETS) await writeCopy(asset);
  await verify();
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
