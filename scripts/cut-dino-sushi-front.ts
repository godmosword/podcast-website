#!/usr/bin/env tsx
/**
 * 多多壽司屋：從飯底切出「前緣層」（蓋在料上的那片海苔），料的下緣才會塞進飯口裡。
 * 前緣層跟飯底同尺寸，切線以上全透明、以下照原圖。不重畫、不生圖。
 *
 *   npx tsx scripts/cut-dino-sushi-front.ts temaki 0.37
 *
 * 切線比例要跟 lib/games/dino-sushi/art.tsx 的註解一致（手捲：畫布高 FRONT_CUT 以上是透明的）。
 */
import { join } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/transcribe-core";

const FOOD_DIR = join(ROOT, "public/games/v2/dino-sushi/food");
/** 目前只有手捲用前片（art.tsx 的 TEMAKI_FRONT_SRC）；軍艦飯面跟海苔邊同高，不需要。 */
const SLUGS = new Set(["temaki"]);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 2) throw new Error("要剛好兩個參數：<slug> <切線比例>");
  const [slug, ratioArg] = args;
  const ratio = Number(ratioArg);
  if (!slug || !SLUGS.has(slug)) throw new Error(`用法：cut-dino-sushi-front.ts <${[...SLUGS].join("|")}> <0–1 的切線比例>`);
  if (!(ratio > 0 && ratio < 1)) throw new Error(`切線比例要在 0 與 1 之間：${ratioArg}`);
  const src = join(FOOD_DIR, `${slug}.webp`);
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cut = Math.round(info.height * ratio);
  const out = Buffer.from(data);
  out.fill(0, 0, cut * info.width * 4);
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(join(FOOD_DIR, `${slug}-front.webp`));
  console.log(`✓ ${slug}-front.webp：${info.width}×${info.height}，第 ${cut} 列以上透明（${(ratio * 100).toFixed(1)}%）`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
