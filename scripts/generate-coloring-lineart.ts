#!/usr/bin/env tsx
/**
 * 依 data/coloring-pages.ts 從既有 JPG 產生線稿 PNG。
 *
 *   npm run generate:coloring-lineart
 *   npm run generate:coloring-lineart -- --verify
 */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { COLORING_PAGES } from "../data/coloring-pages";
import { ROOT } from "./lib/transcribe-core";
import {
  COLORING_LINEART_MAX_SIDE,
  convertToLineArt,
  isMostlyWhiteBackground,
} from "./lib/coloring-lineart";

const PUBLIC_DIR = join(ROOT, "public");
const COVER_OUT = join(PUBLIC_DIR, "games/v2/coloring-book/cover.webp");
const MIN_LINEART_BYTES = 2_000;

async function verifyPage(id: string, outPath: string): Promise<boolean> {
  const bytes = statSync(outPath).size;
  const meta = await sharp(outPath).metadata();
  if (!meta.width || !meta.height) {
    console.log(`✗ ${id}: 無尺寸`);
    return false;
  }
  if (meta.width > COLORING_LINEART_MAX_SIDE || meta.height > COLORING_LINEART_MAX_SIDE) {
    console.log(`✗ ${id}: 超過 ${COLORING_LINEART_MAX_SIDE}`);
    return false;
  }
  if (bytes < MIN_LINEART_BYTES) {
    console.log(`✗ ${id}: 檔案過小 (${bytes} bytes)`);
    return false;
  }
  const buf = await sharp(outPath).png().toBuffer();
  if (!(await isMostlyWhiteBackground(buf))) {
    console.log(`✗ ${id}: 背景不夠白`);
    return false;
  }
  console.log(`✓ ${id} ${meta.width}×${meta.height} (${bytes} bytes)`);
  return true;
}

async function generateCover(): Promise<void> {
  const source = join(PUBLIC_DIR, "characters/小紅賽車.jpg");
  mkdirSync(dirname(COVER_OUT), { recursive: true });
  await sharp(source)
    .resize(800, 600, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toFile(COVER_OUT);
  console.log(`✓ cover → ${COVER_OUT.replace(ROOT + "/", "")}`);
}

async function main(): Promise<void> {
  const verifyOnly = process.argv.includes("--verify");
  let ok = true;

  for (const page of COLORING_PAGES) {
    const src = join(PUBLIC_DIR, page.sourcePath);
    const outRel = page.lineArtSrc.replace(/^\//, "");
    const out = join(PUBLIC_DIR, outRel);

    if (!verifyOnly) {
      const result = await convertToLineArt(src);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, result.buffer);
      console.log(`→ ${outRel} (${result.width}×${result.height})`);
    }

    if (!(await verifyPage(page.id, out))) ok = false;
  }

  if (!verifyOnly) {
    await generateCover();
  }

  if (!ok) process.exit(1);
  console.log(`✓ 著色線稿 ${COLORING_PAGES.length} 頁就緒`);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
