#!/usr/bin/env tsx
/**
 * 已上線線稿補漏線（不生圖、不加粗）：morph close 封住幾 px 的小缺口，
 * 讓「填滿」不會從斷掉的輪廓灌到隔壁。
 *
 *   npm run generate:coloring-close-gaps                      # 量全部頁，只報告
 *   npm run generate:coloring-close-gaps -- --only <id[,id]>  # 只量指定頁
 *   npm run generate:coloring-close-gaps -- --preview <dir>   # 另存對照圖（紅＝補上的線）
 *   npm run generate:coloring-close-gaps -- --approve         # 只覆蓋「多分出區塊」的頁
 *
 * 覆蓋後記得把該頁 lineArtRevision +1，並重跑 generate:coloring-reference。
 * 沒有地平線的頁（天空和地面同一塊）不是缺口，這支補不了。
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { COLORING_PAGES } from "../data/coloring-pages";
import { closeAndThickenLineArt } from "./lib/coloring-lineart";
import { labelRegions } from "./lib/coloring-reference";
import { ROOT } from "./lib/transcribe-core";

/** 只算夠大、小朋友會去塗的區塊。 */
const MIN_REGION_AREA = 400;

async function regionCount(png: Buffer): Promise<number> {
  const { data, info } = await sharp(png)
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.width !== info.height) throw new Error("線稿應為正方形");
  const { label } = labelRegions(new Uint8Array(data), info.width);
  const area = new Map<number, number>();
  for (const id of label) if (id >= 0) area.set(id, (area.get(id) ?? 0) + 1);
  return [...area.values()].filter((n) => n >= MIN_REGION_AREA).length;
}

/**
 * 只把「補上的線」塗黑疊回原圖，原本線條的反鋸齒不動
 * （closeAndThickenLineArt 的輸出是二值圖，直接用會讓線變鋸齒）。
 */
async function patchOriginal(before: Buffer, closed: Buffer) {
  const a = await sharp(before).greyscale().raw().toBuffer();
  const b = await sharp(closed).greyscale().raw().toBuffer();
  const { data, info } = await sharp(before)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const patched = Buffer.from(data);
  const overlay = Buffer.alloc(a.length * 3, 255);
  let added = 0;
  for (let i = 0; i < a.length; i++) {
    const was = a[i]! < 128;
    const now = b[i]! < 128;
    if (now && !was) {
      added++;
      for (let c = 0; c < info.channels; c++) patched[i * info.channels + c] = 0;
      overlay.set([230, 30, 30], i * 3);
    } else if (was) overlay.set([0, 0, 0], i * 3);
  }
  const png = await sharp(patched, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
  return { added, overlay, png };
}

function parseArgs(argv: readonly string[]) {
  const value = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? (argv[i + 1] ?? null) : null;
  };
  return {
    only: value("--only")?.split(",").filter(Boolean) ?? null,
    radius: Number(value("--radius") ?? 2),
    preview: value("--preview"),
    approve: argv.includes("--approve"),
  };
}

async function main() {
  const { only, radius, preview, approve } = parseArgs(process.argv.slice(2));
  if (preview) mkdirSync(preview, { recursive: true });
  const pages = COLORING_PAGES.filter((p) => !only || only.includes(p.id));
  for (const page of pages) {
    const path = join(ROOT, "public", page.lineArtSrc.slice(1));
    const before = readFileSync(path);
    const { buffer: closed, width, height } = await closeAndThickenLineArt(before, radius, {
      thicken: false,
      clearMargin: false,
    });
    const { added, overlay, png: after } = await patchOriginal(before, closed);
    const [was, now] = [await regionCount(before), await regionCount(after)];
    const gained = now > was;
    console.log(
      `${gained ? "＋" : "・"} ${page.id} 區塊 ${was} → ${now}，補線 ${added} px${gained && approve ? "（已覆蓋）" : ""}`,
    );
    if (preview) {
      await sharp(overlay, { raw: { width, height, channels: 3 } })
        .png()
        .toFile(join(preview, `${page.id}.png`));
    }
    if (gained && approve) writeFileSync(path, after);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
