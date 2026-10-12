#!/usr/bin/env tsx
/**
 * 把 public/coloring 的參考彩圖從舊飽和色換成粉彩。
 *
 * 不跑 generate:coloring-reference：那支腳本用 snapToPalette 依「現在的」色票
 * 重新指派區塊。新色票下，舊的紅會收到咖啡、舊的綠會收到草綠，淺黃／淺橘／天空藍
 * 會被奶油規則收成白，已經人工修過的構圖會變。
 *
 * 這裡只做確定性換色：離舊色票夠近的像素，換成同一 id 的新色。線條與混色留著。
 * 對照表與 localStorage 遷移共用 lib/coloring/palette-migration.ts。
 *
 *   npm run recolor:coloring-reference
 */
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { recolorLegacyPixel } from "../lib/coloring/palette-migration";
import { ROOT } from "./lib/transcribe-core";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, acc);
    else if (name === "color.webp") acc.push(path);
  }
  return acc;
}

async function recolorFile(path: string): Promise<void> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  let changed = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = recolorLegacyPixel(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!);
    if (r !== pixels[i] || g !== pixels[i + 1] || b !== pixels[i + 2]) changed += 1;
    pixels[i] = r;
    pixels[i + 1] = g;
    pixels[i + 2] = b;
  }
  await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .webp({ lossless: true })
    .toFile(path);
  console.log(`✓ ${path} 換了 ${changed} 顆像素`);
}

async function main() {
  const files = walk(join(ROOT, "public/coloring"));
  if (files.length === 0) throw new Error("找不到 color.webp");
  for (const file of files) await recolorFile(file);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
