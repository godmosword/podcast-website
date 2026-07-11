#!/usr/bin/env tsx
/**
 * D1：為各集 01.jpg 封面產生 blurDataURL manifest。
 *
 *   npm run generate:story-blurs
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { getStories } from "../data/content";
import { storyCoverPath } from "../lib/story-utils";
import { ROOT } from "./lib/transcribe-core";

const BLUR_WIDTH = 12;
const OUT_PATH = join(ROOT, "data", "story-image-blurs.json");

async function blurDataUrlForJpg(absPath: string): Promise<string> {
  const buf = await sharp(absPath)
    .resize(BLUR_WIDTH, undefined, { withoutEnlargement: true })
    .blur(2)
    .jpeg({ quality: 45 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

async function main(): Promise<void> {
  const manifest: Record<string, string> = {};

  for (const story of getStories()) {
    const src = storyCoverPath(story.slug);
    const abs = join(ROOT, "public", src.slice(1));
    try {
      manifest[src] = await blurDataUrlForJpg(abs);
    } catch {
      console.warn(`⚠ 略過缺檔：${src}`);
    }
  }

  writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ 寫入 ${Object.keys(manifest).length} 筆 blur → data/story-image-blurs.json`);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
