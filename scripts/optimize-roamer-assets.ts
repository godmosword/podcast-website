#!/usr/bin/env tsx
/**
 * 漫遊者 PNG → WebP（保留 PNG fallback）。
 *
 *   npm run optimize:roamer-assets
 *   npm run optimize:roamer-assets -- --verify
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/transcribe-core";
import { pngPathToWebpPath, writeWebpSibling } from "./lib/roamer-webp";

const ROAMER_DIR = join(ROOT, "public/adventures/roamers");

function listPngs(): string[] {
  if (!existsSync(ROAMER_DIR)) return [];
  return readdirSync(ROAMER_DIR)
    .filter((f) => f.endsWith(".png"))
    .sort();
}

async function verify(): Promise<void> {
  const pngs = listPngs();
  if (pngs.length === 0) throw new Error(`找不到 PNG：${ROAMER_DIR}`);

  let ok = true;
  for (const name of pngs) {
    const pngPath = join(ROAMER_DIR, name);
    const webpPath = pngPathToWebpPath(pngPath);
    if (!existsSync(webpPath)) {
      console.log(`✗ ${name}: 缺 ${pngPathToWebpPath(name)}`);
      ok = false;
      continue;
    }
    const pngMeta = await sharp(pngPath).metadata();
    const webpMeta = await sharp(webpPath).metadata();
    const pngBytes = (await sharp(pngPath).toBuffer()).length;
    const webpBytes = (await sharp(webpPath).toBuffer()).length;
    const ratio = webpBytes / pngBytes;
    console.log(
      `${ratio < 0.55 ? "✓" : "⚠"} ${name}: PNG ${Math.round(pngBytes / 1024)}KB → WebP ${Math.round(webpBytes / 1024)}KB (${Math.round(ratio * 100)}%)`,
    );
    if (!webpMeta.hasAlpha) {
      console.log(`  ⚠ ${name}: WebP 無 alpha`);
      ok = false;
    }
    if ((webpMeta.width ?? 0) !== (pngMeta.width ?? 0)) {
      console.log(`  ⚠ 寬度不一致 png=${pngMeta.width} webp=${webpMeta.width}`);
      ok = false;
    }
  }
  if (!ok) process.exit(1);
}

async function optimize(): Promise<void> {
  const pngs = listPngs();
  if (pngs.length === 0) throw new Error(`找不到 PNG：${ROAMER_DIR}`);

  for (const name of pngs) {
    const pngPath = join(ROAMER_DIR, name);
    const webpPath = await writeWebpSibling(pngPath);
    console.log(`✓ ${name} → ${webpPath.replace(ROOT + "/", "")}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--verify")) {
    await verify();
    return;
  }
  await optimize();
  await verify();
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
