#!/usr/bin/env tsx
/**
 * 驗證四島整島 PNG 三階資產齊備（@2x/@3x 非死檔）。
 *
 *   npm run verify:zone-art
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { ZONE_IDS } from "../data/universe-zones";
import { ROOT } from "./lib/transcribe-core";

const ZONE_DIR = join(ROOT, "public/adventures/zones");

function zoneArtFiles(id: string): string[] {
  return [`${id}.png`, `${id}@2x.png`, `${id}@3x.png`];
}

function main(): void {
  let ok = true;
  for (const id of ZONE_IDS) {
    for (const name of zoneArtFiles(id)) {
      const path = join(ZONE_DIR, name);
      if (!existsSync(path)) {
        console.log(`✗ 缺 ${path.replace(ROOT + "/", "")}`);
        ok = false;
      }
    }
  }
  if (ok) {
    console.log(`✓ 五島 zone art 1x/@2x/@3x 齊備（${ZONE_IDS.length * 3} 檔）`);
  } else {
    process.exit(1);
  }
}

main();
