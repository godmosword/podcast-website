#!/usr/bin/env tsx
/**
 * Phase 2：用 OpenAI images.edit 從既有彩圖重生「兒童著色本」乾淨線稿。
 *
 * 生成（寫入 staging，不碰 public/coloring/）：
 *   npm run generate:coloring-ai-lineart -- --only <id[,id]>   # 指定頁
 *   npm run generate:coloring-ai-lineart -- --all              # 全部頁
 *
 * 人工審 contact-sheet.jpg 後逐頁上線（會重跑 gate，未過拒絕覆蓋）：
 *   npm run generate:coloring-ai-lineart -- --approve <id[,id]> [--run <run-id>]
 *
 * gate 常數調整後對既有 staging 免 API 重跑 gate＋重建 contact sheet：
 *   npm run generate:coloring-ai-lineart -- --regate [--run <run-id>]
 *
 * 紅線：AI 圖未經人工審不得上線；CI 不放 OPENAI_API_KEY，僅本機執行。
 * 成本硬閘：每頁最多 MAX_ATTEMPTS_PER_PAGE 次、單次執行最多 MAX_API_CALLS 次 API。
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { COLORING_PAGES, type ColoringPage } from "../data/coloring-pages";
import { ROOT } from "./lib/transcribe-core";
import {
  evaluateLineArtGate,
  formatLineArtQuality,
  postprocessAiLineArt,
  type LineArtGateResult,
} from "./lib/coloring-lineart";

const PUBLIC_DIR = join(ROOT, "public");
const STAGING_ROOT = join(PUBLIC_DIR, ".coloring-staging");
const MAX_ATTEMPTS_PER_PAGE = 2;
const MAX_API_CALLS = 16;

const LINE_ART_PROMPT =
  "Convert this illustration into a children's coloring book page: clean black line art only. " +
  "Thick, uniform black outlines; pure opaque white background; no transparency, no shading, " +
  "no texture, no gray tones, no color fills. Every contour must be fully closed so each region " +
  "can be flood-filled. Simplify or remove the busy background — keep the single main subject " +
  "plus at most a few large simple shapes (cloud, sun, road line). Big simple regions suitable " +
  "for ages 3-7. No text, letters, or numbers anywhere. Keep the characters exactly on-model " +
  "with the reference image(s): same proportions, face, and distinctive features.";

type ManifestEntry = {
  id: string;
  kind: ColoringPage["kind"];
  sourcePath: string;
  referencePaths: readonly string[];
  rawFile: string;
  lineFile: string;
  sha256: string;
  gate: { ok: boolean; problems: string[]; metrics: string };
  attempts: number;
};

type Manifest = {
  runId: string;
  createdAt: string;
  model: string;
  apiCalls: number;
  entries: ManifestEntry[];
};

function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
}

function requireKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("缺 OPENAI_API_KEY（.env.local）；本 script 僅限本機執行。");
  }
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

async function generateRawLineArt(page: ColoringPage): Promise<Buffer> {
  requireKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();

  const refFsPaths = [
    join(PUBLIC_DIR, page.sourcePath),
    ...(page.referencePaths ?? []).map((p) => join(PUBLIC_DIR, p)),
  ].filter((p) => existsSync(p));
  if (refFsPaths.length === 0) throw new Error(`${page.id}: 找不到來源圖 ${page.sourcePath}`);

  const files = await Promise.all(
    refFsPaths.map((p, i) =>
      toFile(readFileSync(p), `ref${i}.jpg`, { type: "image/jpeg" }),
    ),
  );
  const res = await client.images.edit({
    model: getImageModel(),
    image: files,
    prompt: LINE_ART_PROMPT,
    size: "1024x1024",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error(`${page.id}: 圖像模型未回傳影像`);
  return Buffer.from(b64, "base64");
}

async function buildContactSheet(runDir: string, entries: ManifestEntry[]): Promise<void> {
  const thumb = 320;
  const label = 28;
  const cols = 3; // 原彩圖｜現行 line.png｜AI post
  const rows = entries.length;
  const sheet = sharp({
    create: {
      width: thumb * cols,
      height: (thumb + label) * rows,
      channels: 3,
      background: "#ffffff",
    },
  });

  const composites: sharp.OverlayOptions[] = [];
  for (let r = 0; r < entries.length; r += 1) {
    const entry = entries[r]!;
    const top = r * (thumb + label) + label;
    const sources = [
      join(PUBLIC_DIR, entry.sourcePath),
      join(PUBLIC_DIR, `coloring/${entry.id}/line.png`),
      join(runDir, entry.lineFile),
    ];
    for (let c = 0; c < sources.length; c += 1) {
      if (!existsSync(sources[c]!)) continue;
      composites.push({
        input: await sharp(sources[c]!)
          .resize(thumb, thumb, { fit: "contain", background: "#ffffff" })
          .png()
          .toBuffer(),
        top,
        left: c * thumb,
      });
    }
    const gateText = entry.gate.ok ? "gate PASS" : `gate FAIL: ${entry.gate.problems.join("; ")}`;
    const svg =
      `<svg width="${thumb * cols}" height="${label}">` +
      `<text x="4" y="20" font-size="16" font-family="sans-serif" fill="${entry.gate.ok ? "#166534" : "#b42318"}">` +
      `${entry.id} ｜ 原彩圖 → 現行線稿 → AI 新線稿 ｜ ${gateText}</text></svg>`;
    composites.push({ input: Buffer.from(svg), top: top - label, left: 0 });
  }

  await sheet
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(join(runDir, "contact-sheet.jpg"));
}

function latestRunId(): string {
  if (!existsSync(STAGING_ROOT)) throw new Error(`無 staging：${STAGING_ROOT}`);
  const runs = readdirSync(STAGING_ROOT)
    .filter((d) => existsSync(join(STAGING_ROOT, d, "manifest.json")))
    .sort();
  const last = runs[runs.length - 1];
  if (!last) throw new Error("staging 內沒有任何 run（先跑生成）");
  return last;
}

function readManifest(runId: string): Manifest {
  return JSON.parse(
    readFileSync(join(STAGING_ROOT, runId, "manifest.json"), "utf8"),
  ) as Manifest;
}

async function runGenerate(ids: readonly string[]): Promise<void> {
  const pages = COLORING_PAGES.filter((p) => ids.includes(p.id));
  if (pages.length === 0) throw new Error("--only 未匹配任何頁");

  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(STAGING_ROOT, runId);
  mkdirSync(runDir, { recursive: true });

  let apiCalls = 0;
  const entries: ManifestEntry[] = [];

  for (const page of pages) {
    let attempts = 0;
    let line: Buffer | null = null;
    let raw: Buffer | null = null;
    let gate: LineArtGateResult | null = null;

    while (attempts < MAX_ATTEMPTS_PER_PAGE) {
      if (apiCalls >= MAX_API_CALLS) {
        console.error(`✗ 成本硬閘：已達 ${MAX_API_CALLS} 次 API 呼叫，停止`);
        break;
      }
      attempts += 1;
      apiCalls += 1;
      console.log(`→ ${page.id} images.edit（第 ${attempts} 次）…`);
      raw = await generateRawLineArt(page);
      line = await postprocessAiLineArt(raw);
      gate = await evaluateLineArtGate(line, page.kind);
      console.log(
        `  ${gate.ok ? "✓" : "✗"} gate ${formatLineArtQuality(gate.quality)}` +
          (gate.ok ? "" : `\n  - ${gate.problems.join("\n  - ")}`),
      );
      if (gate.ok) break;
    }

    if (!raw || !line || !gate) break;
    const rawFile = `${page.id}.raw.png`;
    const lineFile = `${page.id}.line.png`;
    writeFileSync(join(runDir, rawFile), raw);
    writeFileSync(join(runDir, lineFile), line);
    entries.push({
      id: page.id,
      kind: page.kind,
      sourcePath: page.sourcePath,
      referencePaths: page.referencePaths ?? [],
      rawFile,
      lineFile,
      sha256: sha256(line),
      gate: {
        ok: gate.ok,
        problems: gate.problems,
        metrics: formatLineArtQuality(gate.quality),
      },
      attempts,
    });
  }

  const manifest: Manifest = {
    runId,
    createdAt: new Date().toISOString(),
    model: getImageModel(),
    apiCalls,
    entries,
  };
  writeFileSync(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await buildContactSheet(runDir, entries);

  const rel = runDir.replace(`${ROOT}/`, "");
  console.log(`\n✓ staging：${rel}（API 呼叫 ${apiCalls} 次）`);
  console.log(`  請人工審 ${rel}/contact-sheet.jpg（建議同時開原尺寸 *.line.png）`);
  console.log(
    `  通過後：npm run generate:coloring-ai-lineart -- --approve <id,...> --run ${runId}`,
  );
}

/** gate 常數調整後：對既有 staging 重算 gate、覆寫 manifest、重建 contact sheet（不呼叫 API）。 */
async function runRegate(runIdArg: string | null): Promise<void> {
  const runId = runIdArg ?? latestRunId();
  const runDir = join(STAGING_ROOT, runId);
  const manifest = readManifest(runId);

  for (const entry of manifest.entries) {
    const buf = readFileSync(join(runDir, entry.lineFile));
    const gate = await evaluateLineArtGate(buf, entry.kind);
    entry.gate = {
      ok: gate.ok,
      problems: gate.problems,
      metrics: formatLineArtQuality(gate.quality),
    };
    console.log(
      `${gate.ok ? "✓" : "✗"} ${entry.id} ${entry.gate.metrics}` +
        (gate.ok ? "" : `\n  - ${gate.problems.join("\n  - ")}`),
    );
  }
  writeFileSync(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await buildContactSheet(runDir, manifest.entries);
  console.log(`✓ regate 完成：${runDir.replace(`${ROOT}/`, "")}`);
}

async function runApprove(ids: readonly string[], runIdArg: string | null): Promise<void> {
  const runId = runIdArg ?? latestRunId();
  const runDir = join(STAGING_ROOT, runId);
  const manifest = readManifest(runId);

  let ok = true;
  for (const id of ids) {
    const entry = manifest.entries.find((e) => e.id === id);
    if (!entry) {
      console.error(`✗ ${id}: 不在 run ${runId} 的 manifest`);
      ok = false;
      continue;
    }
    const linePath = join(runDir, entry.lineFile);
    const buf = readFileSync(linePath);
    if (sha256(buf) !== entry.sha256) {
      console.error(`✗ ${id}: staging 檔已變動（sha256 不符），拒絕上線`);
      ok = false;
      continue;
    }
    const gate = await evaluateLineArtGate(buf, entry.kind);
    if (!gate.ok) {
      console.error(`✗ ${id}: approve 前 gate 未過：${gate.problems.join("; ")}`);
      ok = false;
      continue;
    }
    const dest = join(PUBLIC_DIR, `coloring/${id}/line.png`);
    mkdirSync(join(PUBLIC_DIR, `coloring/${id}`), { recursive: true });
    copyFileSync(linePath, dest);
    console.log(`✓ ${id} → ${dest.replace(`${ROOT}/`, "")}（${gate ? formatLineArtQuality(gate.quality) : ""}）`);
  }
  if (!ok) process.exit(1);
}

function parseList(argv: readonly string[], flag: string): string[] {
  const i = argv.indexOf(flag);
  if (i === -1 || !argv[i + 1]) return [];
  return argv[i + 1]!.split(",").filter(Boolean);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--regate")) {
    const runArg = parseList(argv, "--run");
    await runRegate(runArg[0] ?? null);
    return;
  }
  const approveIds = parseList(argv, "--approve");
  if (approveIds.length > 0) {
    const runArg = parseList(argv, "--run");
    await runApprove(approveIds, runArg[0] ?? null);
    return;
  }

  const only = parseList(argv, "--only");
  const ids = argv.includes("--all") ? COLORING_PAGES.map((p) => p.id) : only;
  if (ids.length === 0) {
    throw new Error("用法：--only <id[,id]> 或 --all；上線用 --approve <id[,id]>");
  }
  await runGenerate(ids);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
