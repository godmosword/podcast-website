#!/usr/bin/env tsx
/**
 * D1：為各集 01.jpg 封面產生 blurDataURL manifest。
 * 已有的項目保留，只補缺的封面；封面檔不在就失敗，不靜默略過。
 *
 *   npm run generate:story-blurs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
  const existing: Record<string, string> = existsSync(OUT_PATH)
    ? (JSON.parse(readFileSync(OUT_PATH, "utf8")) as Record<string, string>)
    : {};
  const added: Record<string, string> = {};
  const missingFiles: string[] = [];

  for (const story of getStories()) {
    const src = storyCoverPath(story.slug);
    if (existing[src] || added[src]) continue;
    const abs = join(ROOT, "public", src.slice(1));
    if (!existsSync(abs)) {
      missingFiles.push(src);
      continue;
    }
    added[src] = await blurDataUrlForJpg(abs);
  }

  if (missingFiles.length > 0) {
    console.error(`✗ 封面缺檔，無法產生 blur：\n${missingFiles.join("\n")}`);
    process.exit(1);
  }

  const manifest = { ...added, ...existing };
  writeFileSync(OUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `✓ blur ${Object.keys(manifest).length} 筆（本輪新增 ${Object.keys(added).length}）→ data/story-image-blurs.json`,
  );
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
