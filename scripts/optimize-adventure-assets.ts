#!/usr/bin/env tsx
/**
 * adventures PNG → WebP（保留 PNG fallback；跳過 roamers/ 已有獨立腳本）。
 *
 *   npm run optimize:adventures
 *   npm run optimize:adventures -- --verify
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/transcribe-core";
import { pngPathToWebpPath, writeWebpSibling } from "./lib/roamer-webp";

const ADVENTURES_DIR = join(ROOT, "public/adventures");
const SKIP_DIRS = new Set(["roamers"]);

function listPngs(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...listPngs(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".png")) {
      out.push(full);
    }
  }
  return out.sort();
}

function formatKb(bytes: number): string {
  return `${Math.round(bytes / 1024)}KB`;
}

async function verify(): Promise<void> {
  const pngs = listPngs(ADVENTURES_DIR);
  if (pngs.length === 0) throw new Error(`找不到 PNG：${ADVENTURES_DIR}`);

  let ok = true;
  console.log("\n── 壓縮對照 ──");
  let totalPng = 0;
  let totalWebp = 0;

  for (const pngPath of pngs) {
    const rel = relative(ROOT, pngPath);
    const webpPath = pngPathToWebpPath(pngPath);
    if (!existsSync(webpPath)) {
      console.log(`✗ ${rel}: 缺 ${relative(ROOT, webpPath)}`);
      ok = false;
      continue;
    }

    const pngBytes = statSync(pngPath).size;
    const webpBytes = statSync(webpPath).size;
    totalPng += pngBytes;
    totalWebp += webpBytes;
    const ratio = webpBytes / pngBytes;
    const flag = ratio < 0.55 ? "✓" : "⚠";
    console.log(
      `${flag} ${rel}: PNG ${formatKb(pngBytes)} → WebP ${formatKb(webpBytes)} (${Math.round(ratio * 100)}%)`,
    );

    const pngMeta = await sharp(pngPath).metadata();
    const webpMeta = await sharp(webpPath).metadata();
    const isOpaqueSea = /\/sea(-night)?\.png$/.test(pngPath);
    if (!webpMeta.hasAlpha && (pngMeta.hasAlpha ?? false) && !isOpaqueSea) {
      console.log(`  ⚠ ${rel}: WebP 缺 alpha`);
      ok = false;
    }
    if ((webpMeta.width ?? 0) !== (pngMeta.width ?? 0)) {
      console.log(`  ⚠ ${rel}: 寬度不一致 png=${pngMeta.width} webp=${webpMeta.width}`);
      ok = false;
    }
  }

  const saved = totalPng - totalWebp;
  console.log(
    `\n合計：PNG ${formatKb(totalPng)} → WebP ${formatKb(totalWebp)}（省 ${formatKb(saved)}，${Math.round((totalWebp / totalPng) * 100)}%）`,
  );

  if (!ok) process.exit(1);
}

async function optimize(): Promise<void> {
  const pngs = listPngs(ADVENTURES_DIR);
  if (pngs.length === 0) throw new Error(`找不到 PNG：${ADVENTURES_DIR}`);

  for (const pngPath of pngs) {
    const webpPath = await writeWebpSibling(pngPath);
    console.log(`✓ ${relative(ROOT, pngPath)} → ${relative(ROOT, webpPath)}`);
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
