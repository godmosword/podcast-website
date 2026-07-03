#!/usr/bin/env tsx
/**
 * 森林小島整島黏土 PNG（Art Bible v5 + car-park 黃金樣本 reference）。
 *
 *   npm run generate:forest-zone -- --dry-run
 *   npm run generate:forest-zone
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import {
  CLAY_NEGATIVE,
  CLAY_STYLE_PREFIX,
  getImageModel,
} from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const ZONE_DIR = join(ROOT, "public/adventures/zones");
const GOLDEN_REF = join(ZONE_DIR, "car-park.png");
const STAGE_W = 264;
const STAGE_H = 260;

const FOREST_PROMPT =
  `${CLAY_STYLE_PREFIX}Children's claymation forest island diorama, same camera angle and lighting as reference. ` +
  "A small round island with cream sand shore and soft green grass top. Center: a cute short clay oak tree with mushroom path, tiny bird nest, subtle wooden building scaffold (45% construction), a few clay wildflowers. " +
  "Warm matte clay, short soft ground shadow under the island, no gloss. " +
  "Solid flat magenta (#FF00FF) background for chroma-key. Single island centered. " +
  CLAY_NEGATIVE;

async function requireKey(): Promise<void> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("需要 OPENAI_API_KEY（.env.local）");
  }
}

async function generateRaw(): Promise<Buffer> {
  await requireKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  if (!existsSync(GOLDEN_REF)) {
    throw new Error(`缺少黃金樣本 ${GOLDEN_REF}`);
  }
  const ref = await toFile(readFileSync(GOLDEN_REF), "car-park.png", {
    type: "image/png",
  });
  const res = await client.images.edit({
    model: getImageModel(),
    image: [ref],
    prompt: FOREST_PROMPT,
    size: "1024x1024",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("圖像模型未回傳 forest 島");
  return Buffer.from(b64, "base64");
}

/** 洋紅 chroma-key 去背（保留島內白/淺色）。 */
async function chromaKey(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i]!;
    const g = out[i + 1]!;
    const b = out[i + 2]!;
    if (r > 200 && g < 80 && b > 200) {
      out[i + 3] = 0;
    }
  }

  return sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function fitStage(input: Buffer, w: number, h: number): Promise<Buffer> {
  return sharp(input)
    .resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function writeWebp(pngPath: string): Promise<void> {
  const webpPath = pngPath.replace(/\.png$/, ".webp");
  await sharp(pngPath).webp({ quality: 82 }).toFile(webpPath);
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) {
    console.log("✓ dry-run：將產出 forest.png / @2x / @3x + webp");
    console.log(FOREST_PROMPT.slice(0, 120) + "…");
    return;
  }

  mkdirSync(ZONE_DIR, { recursive: true });
  console.log("生圖 forest 島（reference: car-park）…");
  const raw = await generateRaw();
  const keyed = await chromaKey(raw);

  const master = await sharp(keyed).resize(1320, 1300, { fit: "inside" }).png().toBuffer();

  const sizes = [
    { name: "forest.png", w: STAGE_W, h: STAGE_H },
    { name: "forest@2x.png", w: STAGE_W * 2, h: STAGE_H * 2 },
    { name: "forest@3x.png", w: STAGE_W * 3, h: STAGE_H * 3 },
  ] as const;

  for (const { name, w, h } of sizes) {
    const out = join(ZONE_DIR, name);
    const buf = await fitStage(master, w, h);
    writeFileSync(out, buf);
    await writeWebp(out);
    console.log(`  → ${out.replace(ROOT + "/", "")}`);
  }

  console.log("✓ forest 島 PNG + webp 完成");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
