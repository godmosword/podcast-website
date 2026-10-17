#!/usr/bin/env tsx
/**
 * 客人全身黏土貼紙：核准草稿 → 1024 透明 WebP。
 *
 * 只做去背、去掉地面淡影、縮放、必要時水平翻轉。不重畫、不重新生圖。
 * 草稿在 scripts/assets/dino-sushi-customer-drafts/<id>.jpg（白底橫圖）。
 * 成品對齊多多：public/games/v2/dino-sushi/duoduo/sticker-*.webp
 * （1024×1024、透明、輪底約在畫布高度 92%）。
 *
 *   npm run build:dino-sushi-customers
 *   npm run optimize:dino-sushi-assets
 */
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { removeBorderBackground } from "./lib/roamer-alpha";
import { ROOT } from "./lib/transcribe-core";

const CANVAS = 1024;
/** 跟 duoduo-sticker 的 STICKER_GROUND 同一條線。 */
const BASELINE = 942;
/** 車身寬對齊多多閉嘴貼紙的不透明寬（約 859）。 */
const MAX_WIDTH = 880;
/** 挖土機手臂要留在畫布裡。 */
const TOP_MARGIN = 36;

const DRAFTS = join(ROOT, "scripts/assets/dino-sushi-customer-drafts");
const OUT_DIR = join(ROOT, "public/games/v2/dino-sushi/customers");

/**
 * 多多站在舞台左邊，客人要朝左看他。
 * 草稿朝右的才水平翻轉：安安（車頭在右）、鈴鈴（掃把與臉在右）。
 * 東東的铲子已經朝左、香香與阿樂車頭在左，不翻。
 * 小紅本來朝左，車門上的「2」翻過去會反，所以維持原向。
 */
const MIRROR: ReadonlySet<string> = new Set(["anan", "lingling"]);

const IDS = ["xiaohong", "anan", "ale", "lingling", "dongdong", "xiangxiang"] as const;

const WEBP = { quality: 86, alphaQuality: 100, effort: 6 } as const;

function isSupport(r: number, g: number, b: number, a: number): boolean {
  if (a < 200) return false;
  const lum = (r + g + b) / 3;
  return lum < 118 || Math.max(r, g, b) - Math.min(r, g, b) > 24;
}

/** 地面淡影：低飽和灰、比輪胎亮，而且落在車身支撐點下面。灰色管子、保險桿在支撐點上面，留著。 */
function isGroundShadow(r: number, g: number, b: number, a: number): boolean {
  if (a < 8) return false;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  const lum = (r + g + b) / 3;
  return sat <= 18 && lum >= 130 && lum <= 242 && r - b <= 16;
}

function peelGroundShadow(data: Buffer, w: number, h: number): number {
  const supportBottom = new Int32Array(w).fill(-1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (isSupport(data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!)) supportBottom[x] = y;
    }
  }
  const bottoms: number[] = [];
  for (let x = 0; x < w; x++) if (supportBottom[x]! >= 0) bottoms.push(supportBottom[x]!);
  bottoms.sort((a, b) => a - b);
  const ground = bottoms[Math.floor(bottoms.length * 0.9)] ?? h - 1;
  let removed = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!isGroundShadow(data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!)) continue;
      const floor = supportBottom[x]! >= 0 ? supportBottom[x]! : ground;
      if (y <= floor + 1) continue;
      data[i + 3] = 0;
      removed++;
    }
  }
  return removed;
}

type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function opaqueBounds(data: Buffer, w: number, h: number): Bounds {
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3]! <= 24) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX) throw new Error("去背後找不到車身");
  return { minX, minY, maxX, maxY };
}

async function buildOne(id: string): Promise<void> {
  const src = readFileSync(join(DRAFTS, `${id}.jpg`));
  const { png, bgPct } = await removeBorderBackground(src);
  let working = png;
  if (MIRROR.has(id)) working = await sharp(working).flop().png().toBuffer();
  const peeled = await sharp(working).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const shadowPx = peelGroundShadow(peeled.data, peeled.info.width, peeled.info.height);
  const peeledPng = await sharp(peeled.data, {
    raw: { width: peeled.info.width, height: peeled.info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  const trimmed = await sharp(peeledPng).trim({ threshold: 1 }).png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const scale = Math.min(MAX_WIDTH / w, (BASELINE - TOP_MARGIN) / h);
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const resized = await sharp(trimmed).resize(nw, nh, { fit: "fill" }).png().toBuffer();
  const left = Math.round((CANVAS - nw) / 2);
  const top = BASELINE - nh;
  if (top < 0 || left < 0) throw new Error(`${id} 超出畫布 top=${top} left=${left}`);
  const canvas = await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();

  const raw = await sharp(canvas).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const box = opaqueBounds(raw.data, CANVAS, CANVAS);
  const bottom = box.maxY + 1;
  if (Math.abs(bottom - BASELINE) > 2) {
    throw new Error(`${id} 輪底在 y=${bottom}，應為 ${BASELINE}`);
  }
  await sharp(canvas).webp(WEBP).toFile(join(OUT_DIR, `${id}.webp`));
  console.log(
    `${id} 去背 ${bgPct.toFixed(1)}% 淡影 ${shadowPx}px ${MIRROR.has(id) ? "翻轉 " : ""}` +
      `車身 ${box.maxX - box.minX + 1}×${box.maxY - box.minY + 1} 底 ${bottom}`,
  );
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const id of IDS) await buildOne(id);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
