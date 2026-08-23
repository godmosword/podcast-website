#!/usr/bin/env tsx
/**
 * D1：首頁 segment hero + 內頁 hero-home + 故事插圖（01.jpg 與後續幕）預生成 WebP／AVIF。
 *
 *   npm run optimize:lcp-images
 *   npm run optimize:lcp-images -- --verify
 */
import { join } from "node:path";
import { ROOT } from "./lib/transcribe-core";
import {
  listLcpJpgTargets,
  verifyModernSiblings,
  writeModernSiblings,
} from "./lib/lcp-image-optimize";

const PUBLIC_DIR = join(ROOT, "public");

async function verifyAll(targets: string[]): Promise<void> {
  let ok = true;
  for (const jpg of targets) {
    const pass = await verifyModernSiblings(jpg);
    if (!pass) {
      console.log(`✗ 缺或尺寸不符：${jpg.replace(ROOT + "/", "")}`);
      ok = false;
    }
  }
  if (!ok) process.exit(1);
  console.log(`✓ ${targets.length} 組 LCP 圖 WebP／AVIF 齊備`);
}

async function main(): Promise<void> {
  const targets = listLcpJpgTargets(PUBLIC_DIR);
  if (targets.length === 0) {
    throw new Error("找不到 LCP JPG 目標");
  }

  if (process.argv.includes("--verify")) {
    await verifyAll(targets);
    return;
  }

  for (const jpg of targets) {
    if (await verifyModernSiblings(jpg)) continue;
    await writeModernSiblings(jpg);
  }
  await verifyAll(targets);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
