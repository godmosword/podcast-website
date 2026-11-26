#!/usr/bin/env tsx
/**
 * 為角色圖鑑定裝照產生 blurDataURL。
 * 字串路徑的 next/image 沒有內建 LQIP，要另外提供 blurDataURL。不改原圖。
 *
 *   npm run generate:character-blurs
 */
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getCharacters } from "../data/characters";
import { blurDataUrlForJpg } from "./lib/story-cover-blur";
import { ROOT } from "./lib/transcribe-core";

const OUT = "data/character-image-blurs.json";

async function main(): Promise<void> {
  const manifest: Record<string, string> = {};
  const missing: string[] = [];

  for (const character of getCharacters()) {
    if (!character.ref) continue;
    const rel = character.ref.replace(/^\//, "");
    const src = `/${rel}`;
    const abs = join(ROOT, "public", rel);
    if (!existsSync(abs)) {
      missing.push(src);
      continue;
    }
    manifest[src] = await blurDataUrlForJpg(abs);
  }

  if (missing.length > 0) {
    console.error(`✗ 定裝照缺檔，無法產生 blur：\n${missing.join("\n")}`);
    process.exit(1);
  }

  writeFileSync(join(ROOT, OUT), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ 角色 blur ${Object.keys(manifest).length} 筆 → ${OUT}`);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
