#!/usr/bin/env tsx
/**
 * 生成繪本著色遊戲的黏土風封面。
 *
 * 生圖只寫入人工審稿用 staging：
 *   npm run generate:coloring-cover -- --dry-run
 *   npm run generate:coloring-cover
 *
 * 審圖通過後才覆蓋正式封面：
 *   npm run generate:coloring-cover -- --approve [--run <run-id>]
 *
 * 紅線：未經人工審稿不得上線；CI 不放 OPENAI_API_KEY。
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import {
  CLAY_NEGATIVE,
  CLAY_STYLE_PREFIX,
  getImageModel,
} from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const PUBLIC_DIR = join(ROOT, "public");
const STAGING_ROOT = join(PUBLIC_DIR, ".games-staging");
const TARGET_COVER = join(PUBLIC_DIR, "games/v2/coloring-book/cover.webp");
const CANDY_MATCH_COVER = join(PUBLIC_DIR, "games/v2/candy-match/cover.webp");

const COVER_RAW_FILE = "cover.raw.png";
const COVER_FILE = "cover.webp";
const CONTACT_FILE = "contact-sheet.jpg";
const API_SIZE = "1536x1024";
const MAX_API_CALLS = 4;

const REFERENCE_PATHS = [
  join(PUBLIC_DIR, "characters/小紅賽車.jpg"),
  join(PUBLIC_DIR, "characters/恐龍車多多.jpg"),
] as const;

const COVER_PROMPT = [
  CLAY_STYLE_PREFIX,
  "Use the provided reference images only for on-model vehicle identity, proportions, faces, and silhouettes; do not copy their background or palette.",
  "Centered huge open children's coloring book as the hero object (black line art pages with partial crayon coloring and color dots — clearly readable as \"colorable\"). Two clay vehicles beside the book holding crayons: red race car 小紅賽車 and green dinosaur car 恐龍車多多.",
  "Subjects fully inside a central 16:9 safe frame (leave soft margins top/bottom for 16:9 crop of 4:3 art).",
  "PASTEL candy-match world: soft pink/peach/mint pastel glow, cotton candy clouds, white/cream ground, distant pale clay ferris wheel. Explicitly NO royal-blue flat wall, NO high-saturation photo look.",
  "Dinosaur car: closed friendly smile mouth; NO toothbrush, NO teeth close-up, NO candy props around him.",
  "Hosts Bonbon/Mami NOT in frame. No text/letters/numbers/logos/watermarks.",
  CLAY_NEGATIVE,
].join(" ");

type CoverManifest = {
  runId: string;
  createdAt: string;
  model: string;
  apiSize: string;
  apiCalls: number;
  maxApiCalls: number;
  referencePaths: readonly string[];
  rawFile: string;
  coverFile: string;
  comparisonFile: string | null;
  sha256: string;
  prompt: string;
};

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function consumeApiCall(apiCalls: number): number {
  if (apiCalls >= MAX_API_CALLS) {
    throw new Error(`成本硬閘：已達 ${MAX_API_CALLS} 次 API 呼叫，停止。`);
  }
  return apiCalls + 1;
}

function displayPath(filePath: string): string {
  return relative(ROOT, filePath) || ".";
}

function createRunId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function validateRunId(runId: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(runId)) {
    throw new Error(`run-id 格式無效：${runId}`);
  }
  return runId;
}

function runDirFor(runId: string): string {
  return join(STAGING_ROOT, validateRunId(runId));
}

function latestRunId(): string {
  if (!existsSync(STAGING_ROOT)) {
    throw new Error(`找不到 staging：${displayPath(STAGING_ROOT)}；請先執行生成。`);
  }
  const runs = readdirSync(STAGING_ROOT, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(join(STAGING_ROOT, entry.name, "manifest.json")),
    )
    .map((entry) => entry.name)
    .sort();
  const latest = runs[runs.length - 1];
  if (!latest) {
    throw new Error("staging 內沒有可 approve 的 run；請先執行生成。");
  }
  return latest;
}

function isCoverManifest(value: unknown): value is CoverManifest {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  const referencePaths = record.referencePaths;
  return (
    typeof record.runId === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.model === "string" &&
    typeof record.apiSize === "string" &&
    typeof record.apiCalls === "number" &&
    typeof record.maxApiCalls === "number" &&
    Array.isArray(referencePaths) &&
    referencePaths.every((path): path is string => typeof path === "string") &&
    typeof record.rawFile === "string" &&
    typeof record.coverFile === "string" &&
    (record.comparisonFile === null ||
      typeof record.comparisonFile === "string") &&
    typeof record.prompt === "string" &&
    typeof record.sha256 === "string"
  );
}

function readManifest(runId: string): CoverManifest {
  const manifestPath = join(runDirFor(runId), "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`找不到 manifest：${displayPath(manifestPath)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  } catch {
    throw new Error(`manifest 解析失敗：${displayPath(manifestPath)}`);
  }
  if (!isCoverManifest(parsed)) {
    throw new Error(`manifest 格式錯誤：${displayPath(manifestPath)}`);
  }
  return parsed;
}

function requireApiKey(): void {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "缺 OPENAI_API_KEY。請在 .env.local 設定；本 script 僅限本機執行。",
    );
  }
  if (key === "sk-..." || key.endsWith("...")) {
    throw new Error(
      "OPENAI_API_KEY 仍是占位符。請改成 platform.openai.com 的有效 key。",
    );
  }
}

function verifyReferenceImages(): void {
  const missing = REFERENCE_PATHS.filter((filePath) => !existsSync(filePath));
  if (missing.length > 0) {
    throw new Error(`缺少角色參考圖：${missing.map(displayPath).join("、")}`);
  }
}

async function generateRawCover(): Promise<Buffer> {
  requireApiKey();

  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const files = await Promise.all(
    REFERENCE_PATHS.map((filePath, index) =>
      toFile(readFileSync(filePath), `ref${index}.jpg`, {
        type: "image/jpeg",
      }),
    ),
  );

  const response = await client.images.edit({
    model: getImageModel(),
    image: files,
    prompt: COVER_PROMPT,
    size: API_SIZE,
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) {
    throw new Error("圖像模型未回傳影像");
  }
  return Buffer.from(base64, "base64");
}

async function writeComparison(
  runDir: string,
  generatedCover: Buffer,
): Promise<string | null> {
  if (!existsSync(CANDY_MATCH_COVER)) {
    console.warn(
      `⚠ 找不到 candy-match 基準圖，略過併排 contact：${displayPath(CANDY_MATCH_COVER)}`,
    );
    return null;
  }

  const tileWidth = 724;
  const tileHeight = 543;
  const labelHeight = 48;
  const [generatedTile, baselineTile] = await Promise.all([
    sharp(generatedCover)
      .resize(tileWidth, tileHeight, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer(),
    sharp(CANDY_MATCH_COVER)
      .resize(tileWidth, tileHeight, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer(),
  ]);
  const labels = Buffer.from(
    `<svg width="${tileWidth * 2}" height="${labelHeight}">` +
      `<rect width="100%" height="100%" fill="#fffaf5"/>` +
      `<text x="20" y="31" font-family="sans-serif" font-size="22" fill="#5b3a47">著色本 cover</text>` +
      `<text x="${tileWidth + 20}" y="31" font-family="sans-serif" font-size="22" fill="#5b3a47">candy-match 基準</text>` +
      "</svg>",
  );

  const canvas = sharp({
    create: {
      width: tileWidth * 2,
      height: labelHeight + tileHeight,
      channels: 3,
      background: "#ffffff",
    },
  });
  const overlays: sharp.OverlayOptions[] = [
    { input: labels, left: 0, top: 0 },
    { input: generatedTile, left: 0, top: labelHeight },
    { input: baselineTile, left: tileWidth, top: labelHeight },
  ];
  const comparisonPath = join(runDir, CONTACT_FILE);
  await canvas.composite(overlays).jpeg({ quality: 90 }).toFile(comparisonPath);
  return comparisonPath;
}

async function runGenerate(): Promise<void> {
  verifyReferenceImages();

  const runId = createRunId();
  const runDir = runDirFor(runId);
  mkdirSync(runDir, { recursive: true });

  let apiCalls = 0;
  apiCalls = consumeApiCall(apiCalls);
  console.log(
    `→ images.edit（${API_SIZE}，API 呼叫 ${apiCalls}/${MAX_API_CALLS}）…`,
  );
  const rawCover = await generateRawCover();
  const finalCover = await sharp(rawCover)
    .resize(1448, 1086, { fit: "cover" })
    .webp({ quality: 82 })
    .toBuffer();

  const rawPath = join(runDir, COVER_RAW_FILE);
  const coverPath = join(runDir, COVER_FILE);
  writeFileSync(rawPath, rawCover);
  writeFileSync(coverPath, finalCover);
  const comparisonPath = await writeComparison(runDir, finalCover);

  const manifest: CoverManifest = {
    runId,
    createdAt: new Date().toISOString(),
    model: getImageModel(),
    apiSize: API_SIZE,
    apiCalls,
    maxApiCalls: MAX_API_CALLS,
    referencePaths: REFERENCE_PATHS.map(displayPath),
    rawFile: COVER_RAW_FILE,
    coverFile: COVER_FILE,
    comparisonFile: comparisonPath ? CONTACT_FILE : null,
    sha256: sha256(finalCover),
    prompt: COVER_PROMPT,
  };
  writeFileSync(
    join(runDir, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  console.log(`\n✓ staging：${displayPath(runDir)}`);
  console.log(`  原始影像：${displayPath(rawPath)}`);
  console.log(`  最終封面：${displayPath(coverPath)}`);
  if (comparisonPath) {
    console.log(`  併排審稿：${displayPath(comparisonPath)}`);
  }
  console.log(`  sha256：${manifest.sha256}`);
  console.log(
    `\n請人工審圖；通過後執行：npm run generate:coloring-cover -- --approve --run ${runId}`,
  );
}

function runDryRun(): void {
  const runPattern = join(STAGING_ROOT, "<run-id>");
  console.log("模式：dry-run（不呼叫 OpenAI、不寫入 staging 或正式封面）");
  console.log(`模型：${getImageModel()}`);
  console.log(`API 尺寸：${API_SIZE}`);
  console.log(`API 呼叫上限：${MAX_API_CALLS}（本次 0）`);
  console.log(`\n角色參考圖（只作 on-model 參考，不作色盤參考）：`);
  for (const filePath of REFERENCE_PATHS) {
    console.log(`  - ${displayPath(filePath)}`);
  }
  console.log("\n輸出路徑：");
  console.log(`  - ${displayPath(join(runPattern, COVER_RAW_FILE))}`);
  console.log(`  - ${displayPath(join(runPattern, COVER_FILE))}`);
  console.log(`  - ${displayPath(join(runPattern, CONTACT_FILE))}`);
  console.log(`  - ${displayPath(join(runPattern, "manifest.json"))}`);
  console.log(`  - 正式目標（approve 才覆蓋）：${displayPath(TARGET_COVER)}`);
  console.log("\nPrompt：");
  console.log(COVER_PROMPT);
}

function parseRunId(args: readonly string[]): string | null {
  const index = args.indexOf("--run");
  if (index === -1) return null;
  const runId = args[index + 1];
  if (!runId || runId.startsWith("-")) {
    throw new Error("--run 後面需要接 run-id。");
  }
  return validateRunId(runId);
}

function printUsage(): void {
  console.log(`用法：
  npm run generate:coloring-cover -- --dry-run
  npm run generate:coloring-cover
  npm run generate:coloring-cover -- --approve [--run <run-id>]

流程：dry-run 預覽 → 生圖至 public/.games-staging/<run-id>/ → 人工審圖 → --approve。
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    printUsage();
    return;
  }

  const isDryRun = args.includes("--dry-run");
  const isApprove = args.includes("--approve");
  if (isDryRun && isApprove) {
    throw new Error("--dry-run 與 --approve 不可同時使用。");
  }

  const runId = parseRunId(args);
  if (runId && !isApprove) {
    throw new Error("--run 僅能搭配 --approve 使用。");
  }
  if (isApprove) {
    const selectedRunId = runId ?? latestRunId();
    const manifest = readManifest(selectedRunId);
    const runDir = runDirFor(selectedRunId);
    const stagingCover = join(runDir, manifest.coverFile);
    if (manifest.coverFile !== COVER_FILE) {
      throw new Error(`manifest cover 檔名不符：${manifest.coverFile}`);
    }
    if (!existsSync(stagingCover)) {
      throw new Error(`找不到 staging 封面：${displayPath(stagingCover)}`);
    }
    const buffer = readFileSync(stagingCover);
    const actualSha256 = sha256(buffer);
    if (actualSha256 !== manifest.sha256) {
      throw new Error(
        `approve 拒絕：staging 封面 sha256 不符（manifest=${manifest.sha256}，目前=${actualSha256}）。`,
      );
    }
    mkdirSync(dirname(TARGET_COVER), { recursive: true });
    copyFileSync(stagingCover, TARGET_COVER);
    console.log(
      `✓ approve：${displayPath(stagingCover)} → ${displayPath(TARGET_COVER)}`,
    );
    console.log(`  sha256 已核對：${actualSha256}`);
    return;
  }
  if (isDryRun) {
    runDryRun();
    return;
  }
  await runGenerate();
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
