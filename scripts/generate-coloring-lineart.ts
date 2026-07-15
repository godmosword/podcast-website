#!/usr/bin/env tsx
/**
 * 依 data/coloring-pages.ts 從既有 JPG 產生線稿 PNG。
 *
 *   npm run generate:coloring-lineart                    # 全部頁重生＋驗證
 *   npm run generate:coloring-lineart -- --verify        # 只驗證現有資產
 *   npm run generate:coloring-lineart -- --only <id>     # 只重生指定頁（可逗號分隔多個）
 *   npm run generate:coloring-lineart -- --kind character # 只重生某類頁
 *   npm run generate:coloring-lineart -- --cover         # 連同封面 cover.webp 一起重生
 *
 * 注意：AI 重生頁（Phase 2 人工審過）勿用全量重跑覆蓋；用 --only／--kind 限定範圍。
 */
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import sharp from "sharp";
import { COLORING_PAGES } from "../data/coloring-pages";
import { ROOT } from "./lib/transcribe-core";
import {
  COLORING_GATES,
  COLORING_LINEART_MAX_SIDE,
  convertToLineArt,
  evaluateLineArtGate,
  formatLineArtQuality,
} from "./lib/coloring-lineart";

const PUBLIC_DIR = join(ROOT, "public");
const COVER_OUT = join(PUBLIC_DIR, "games/v2/coloring-book/cover.webp");
const MIN_LINEART_BYTES = 2_000;

async function verifyPage(
  id: string,
  kind: keyof typeof COLORING_GATES,
  outPath: string,
): Promise<boolean> {
  const bytes = statSync(outPath).size;
  const meta = await sharp(outPath).metadata();
  if (!meta.width || !meta.height) {
    console.log(`✗ ${id}: 無尺寸`);
    return false;
  }
  if (meta.width > COLORING_LINEART_MAX_SIDE || meta.height > COLORING_LINEART_MAX_SIDE) {
    console.log(`✗ ${id}: 超過 ${COLORING_LINEART_MAX_SIDE}`);
    return false;
  }
  if (bytes < MIN_LINEART_BYTES) {
    console.log(`✗ ${id}: 檔案過小 (${bytes} bytes)`);
    return false;
  }

  const buf = await sharp(outPath).png().toBuffer();
  const { ok, problems, quality } = await evaluateLineArtGate(buf, kind);
  const metrics = formatLineArtQuality(quality);
  if (!ok) {
    console.log(`✗ ${id} [${kind}] ${metrics}\n  - ${problems.join("\n  - ")}`);
    return false;
  }
  console.log(`✓ ${id} [${kind}] ${meta.width}×${meta.height} (${bytes} bytes) ${metrics}`);
  return true;
}

async function generateCover(): Promise<void> {
  const source = join(PUBLIC_DIR, "characters/小紅賽車.jpg");
  mkdirSync(dirname(COVER_OUT), { recursive: true });
  await sharp(source)
    .resize(800, 600, { fit: "cover", position: "attention" })
    .webp({ quality: 82 })
    .toFile(COVER_OUT);
  console.log(`✓ cover → ${COVER_OUT.replace(ROOT + "/", "")}`);
}

function parseArgs(argv: readonly string[]): {
  verifyOnly: boolean;
  cover: boolean;
  only: readonly string[];
  kind: string | null;
} {
  const only: string[] = [];
  let kind: string | null = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--only" && argv[i + 1]) {
      only.push(...argv[i + 1]!.split(",").filter(Boolean));
      i += 1;
    }
    if (argv[i] === "--kind" && argv[i + 1]) {
      kind = argv[i + 1]!;
      i += 1;
    }
  }
  return { verifyOnly: argv.includes("--verify"), cover: argv.includes("--cover"), only, kind };
}

async function main(): Promise<void> {
  const { verifyOnly, cover, only, kind } = parseArgs(process.argv.slice(2));
  const selected = COLORING_PAGES.filter(
    (page) =>
      (only.length === 0 || only.includes(page.id)) && (kind === null || page.kind === kind),
  );
  if (selected.length === 0) {
    throw new Error(`--only/--kind 未匹配任何頁（ids: ${COLORING_PAGES.map((p) => p.id).join(", ")}）`);
  }

  let ok = true;
  for (const page of selected) {
    const src = join(PUBLIC_DIR, page.sourcePath);
    const outRel = page.lineArtSrc.replace(/^\//, "");
    const out = join(PUBLIC_DIR, outRel);

    if (!verifyOnly) {
      const result = await convertToLineArt(src);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, result.buffer);
      console.log(`→ ${outRel} (${result.width}×${result.height})`);
    }

    if (!(await verifyPage(page.id, page.kind, out))) ok = false;
  }

  if (!verifyOnly && cover) {
    await generateCover();
  }

  if (!ok) process.exit(1);
  console.log(`✓ 著色線稿 ${selected.length} 頁就緒`);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
