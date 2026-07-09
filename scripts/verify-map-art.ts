#!/usr/bin/env tsx
/**
 * 驗證宇宙地圖「海／天」黏土素材齊備（Art Bible §14）。
 * 海面需含 @2x；雲／日月僅 1x。
 *
 *   npm run verify:map-art
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./lib/transcribe-core";

const MAP_DIR = join(ROOT, "public/adventures/map");

/** file → 是否需 @2x。 */
const REQUIRED: Record<string, boolean> = {
  "sea.png": false,
  "sea-night.png": false,
  "cloud-a.png": false,
  "cloud-b.png": false,
  "cloud-c.png": false,
  "sun.png": false,
  "moon.png": false,
};

function expectedFiles(): string[] {
  const files: string[] = [];
  for (const [name, needs2x] of Object.entries(REQUIRED)) {
    files.push(name);
    if (needs2x) files.push(name.replace(/\.png$/, "@2x.png"));
  }
  return files;
}

function main(): void {
  let ok = true;
  const files = expectedFiles();
  for (const name of files) {
    const path = join(MAP_DIR, name);
    if (!existsSync(path)) {
      console.log(`✗ 缺 ${path.replace(ROOT + "/", "")}`);
      ok = false;
    }
  }
  if (ok) {
    console.log(`✓ 地圖 map art 齊備（${files.length} 檔）`);
  } else {
    console.log("→ 生成: npm run generate:map-art （夜間素材加 --night）→ 審圖 → --approve");
    process.exit(1);
  }
}

main();
