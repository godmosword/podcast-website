#!/usr/bin/env tsx
/**
 * 驗證四島整島 PNG 三階資產齊備（@2x/@3x 非死檔）。
 *
 *   npm run verify:zone-art
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { ZONE_IDS } from "../data/universe-zones";
import { floodBorderBackground } from "./lib/roamer-alpha";
import { isMagentaFringe } from "./lib/zone-fringe";
import { ROOT } from "./lib/transcribe-core";

const ZONE_DIR = join(ROOT, "public/adventures/zones");

function zoneArtFiles(id: string): string[] {
  return [`${id}.png`, `${id}@2x.png`, `${id}@3x.png`];
}

/** W27-3 迴歸：forest 不得殘留與邊界連通的可見 magenta fringe。 */
async function countForestMagentaFringe(name: string): Promise<number> {
  const { data, info } = await sharp(join(ZONE_DIR, name))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const { removed } = floodBorderBackground(data, w, h, c, isMagentaFringe);
  let visible = 0;
  for (let p = 0; p < w * h; p++) {
    if (removed[p] && data[p * c + 3]! > 0) visible++;
  }
  return visible;
}

async function main(): Promise<void> {
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
  for (const name of zoneArtFiles("forest")) {
    if (!existsSync(join(ZONE_DIR, name))) continue;
    const fringe = await countForestMagentaFringe(name);
    if (fringe > 0) {
      console.log(`✗ ${name} 邊界殘留 magenta fringe ${fringe} px（跑 npm run fix:forest-zone）`);
      ok = false;
    }
  }
  if (ok) {
    console.log(`✓ 五島 zone art 1x/@2x/@3x 齊備（${ZONE_IDS.length * 3} 檔），forest 無 magenta fringe`);
  } else {
    process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
