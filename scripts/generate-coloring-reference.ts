#!/usr/bin/env tsx
/**
 * 從線稿＋原圖產生著色本「參考彩圖」（免 API、可重現）。
 *
 *   npm run generate:coloring-reference                  # 全部頁重生
 *   npm run generate:coloring-reference -- --only <id>   # 指定頁（逗號分隔）
 *   npm run generate:coloring-reference -- --debug <dir> # 另存帶 10×10 格線的檢查圖
 *
 * 顏色只用色盤 12 色，小朋友照著塗得出一樣的畫；取錯的區塊在
 * scripts/lib/coloring-reference-overrides.ts 用格線座標人工修正。
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { COLORING_PAGES, type ColoringPage } from "../data/coloring-pages";
import { ROOT } from "./lib/transcribe-core";
import {
  type Alignment,
  applyRecipe,
  findAlignment,
  labelRegions,
  renderReference,
  sampleRegionColors,
  snapToPalette,
} from "./lib/coloring-reference";
import { REFERENCE_RECIPES } from "./lib/coloring-reference-overrides";

const PUBLIC_DIR = join(ROOT, "public");
const SIZE = 1024;
const ALIGN_SIZE = 192;
const OUTPUT_SIDE = 768;

async function rgb(path: string, size: number): Promise<Uint8Array> {
  const buf = await sharp(path)
    .resize(size, size, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer();
  return new Uint8Array(buf);
}

function gridSvg(side: number): Buffer {
  const step = side / 10;
  const lines = Array.from({ length: 9 }, (_, i) => {
    const v = (i + 1) * step;
    return `<line x1="${v}" y1="0" x2="${v}" y2="${side}"/><line x1="0" y1="${v}" x2="${side}" y2="${v}"/>`;
  }).join("");
  const labels = Array.from({ length: 10 }, (_, i) => {
    const v = i * step + 4;
    return `<text x="${v}" y="14">${i}</text><text x="2" y="${v + 12}">${i}</text>`;
  }).join("");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}">` +
      `<g stroke="#ff00ff" stroke-width="1" opacity="0.6">${lines}</g>` +
      `<g fill="#ff00ff" font-size="13" font-family="monospace">${labels}</g></svg>`,
  );
}

/** 在候選來源中挑對位成本最低的一張（線稿是 AI 重繪，有時更像定裝照）。 */
async function pickSource(page: ColoringPage, forced: string | undefined) {
  const line = labelRegions(
    await rgb(join(PUBLIC_DIR, page.lineArtSrc.slice(1)), ALIGN_SIZE),
    ALIGN_SIZE,
  );
  const candidates = forced
    ? [forced]
    : [page.sourcePath, ...(page.referencePaths ?? [])];
  let best: { path: string; alignment: Alignment; cost: number } | null = null;
  for (const path of candidates) {
    const fit = findAlignment(line, await rgb(join(PUBLIC_DIR, path), ALIGN_SIZE));
    if (!best || fit.cost < best.cost) best = { path, ...fit };
  }
  return best!;
}

async function buildPage(page: ColoringPage, debugDir: string | null) {
  const recipe = REFERENCE_RECIPES[page.id] ?? {};
  const source = await pickSource(page, recipe.source);
  const line = await rgb(join(PUBLIC_DIR, page.lineArtSrc.slice(1)), SIZE);
  const regions = labelRegions(line, SIZE);
  const sampled = sampleRegionColors(
    regions,
    await rgb(join(PUBLIC_DIR, source.path), SIZE),
    source.alignment,
  );
  const colors = applyRecipe(
    sampled.map((c) => (c ? snapToPalette(c) : null)),
    regions,
    recipe,
  );
  const raw = renderReference(line, regions, colors);
  const image = sharp(Buffer.from(raw), {
    raw: { width: SIZE, height: SIZE, channels: 3 },
  }).resize(OUTPUT_SIDE, OUTPUT_SIDE);
  const outPath = join(PUBLIC_DIR, page.referenceSrc.slice(1));
  await image.clone().webp({ quality: 86 }).toFile(outPath);
  if (debugDir) {
    await image
      .clone()
      .composite([{ input: gridSvg(OUTPUT_SIDE) }])
      .jpeg({ quality: 80 })
      .toFile(join(debugDir, `${page.id}.jpg`));
  }
  const a = source.alignment;
  console.log(
    `✓ ${page.id} 區塊 ${regions.count}，取色 ${source.path} ×${a.scale.toFixed(2)} (${a.dx.toFixed(2)}, ${a.dy.toFixed(2)})`,
  );
}

function parseArgs(argv: readonly string[]) {
  const value = (flag: string) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? (argv[i + 1] ?? null) : null;
  };
  const only = value("--only")?.split(",").filter(Boolean) ?? null;
  return { only, debugDir: value("--debug") };
}

async function main() {
  const { only, debugDir } = parseArgs(process.argv.slice(2));
  const pages = COLORING_PAGES.filter((p) => !only || only.includes(p.id));
  if (only && pages.length !== only.length) {
    throw new Error(`找不到頁面：${only.filter((id) => !pages.some((p) => p.id === id)).join(", ")}`);
  }
  if (debugDir) mkdirSync(debugDir, { recursive: true });
  const failures: string[] = [];
  for (const page of pages) {
    try {
      await buildPage(page, debugDir);
    } catch (error: unknown) {
      failures.push(`✗ ${page.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
