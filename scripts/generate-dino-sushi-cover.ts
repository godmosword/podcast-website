#!/usr/bin/env tsx
/**
 * 生成「多多壽司屋」遊樂園卡片的黏土風封面（做法同 generate-coloring-cover.ts）。
 *
 *   npm run generate:dino-sushi-cover -- --dry-run      # 只印 prompt 與路徑，不呼叫 API
 *   npm run generate:dino-sushi-cover                   # 生 1 張到 public/.games-staging/dino-sushi/<run-id>/
 *   npm run generate:dino-sushi-cover -- --approve [--run <run-id>]   # 人工審圖後才覆蓋正式封面
 *
 * 成品：約 2048×1536、WebP q90（API 橫式上限 1536×1024，再放大）。
 * 紅線：付費生圖，每次執行最多 1 次 API 呼叫、不自動重抽；未經人工審稿不得上線；CI 不放 OPENAI_API_KEY。
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import { CLAY_NEGATIVE, CLAY_STYLE_PREFIX, getImageModel } from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const PUBLIC_DIR = join(ROOT, "public");
const STAGING_ROOT = join(PUBLIC_DIR, ".games-staging", "dino-sushi");
const TARGET_COVER = join(PUBLIC_DIR, "games/v2/dino-sushi/cover.webp");
const API_SIZE = "1536x1024";
/** 使用者確認的張數：1 張。 */
const MAX_API_CALLS = 1;
/**
 * 成品約 2048 寬、4:3、WebP q90。
 * 圖像 API 的橫式上限是 1536×1024，這裡用 sharp 放大到 2048×1536（同一 4:3，置中裁切）。
 */
const COVER_SIZE = { width: 2048, height: 1536 } as const;
const COVER_WEBP_QUALITY = 90;

/** 第 1 張定角色（on-model），第 2 張只參考黏土質感與粉彩色盤。 */
const REFERENCE_PATHS = [
  join(PUBLIC_DIR, "characters/恐龍車多多.jpg"),
  join(PUBLIC_DIR, "games/v2/candy-match/cover.webp"),
] as const;

/** 併排審稿：遊樂園另外三張封面。 */
const SIBLING_COVERS = ["coloring-book", "candy-match", "block-drop"].map((slug) =>
  join(PUBLIC_DIR, `games/v2/${slug}/cover.webp`),
);

const COVER_PROMPT = [
  CLAY_STYLE_PREFIX,
  "Image 1 is the character reference for colors and parts only: green dinosaur car 恐龍車多多 — green body #5CB83A, lighter green muzzle #8FD14F, orange spikes #F28A2E along the head and back, thick warm-brown eyebrows (not harsh black), big round eyes on the head, a blue side window with no face on the glass, four black wheels only. No arms, no hands, no limbs. Do not copy its background or its open mouth.",
  "Image 2 is a style reference only: match its claymation material, pastel candy amusement-park palette and soft lighting; do not copy its objects or layout.",
  "Camera: the same three-quarter view as a toy facing screen-right (head on the right, rear of the car on the left). The WHOLE vehicle is inside the frame — all four wheels, every spike, the exhaust — not cropped by the counter, the awning, or the edges.",
  "Face, preschool-safe for about age 5: a gentle happy smile, mouth only slightly open. Four to six small rounded white teeth. No red gums, no tongue, no yellow teeth, no huge grin, no rows of fangs. The mouth must not cover half the face.",
  "Lighting matches the in-game vector: soft key light from the top-left at 45 degrees, a translucent shadow on the lower-left of each clay form, a faint rim light on the top-right edge. Matte clay, low contrast, no hard studio speculars.",
  "Scene: a cheerful pastel clay conveyor-belt sushi stand inside the amusement park. 恐龍車多多 sits beside the counter, looking at the plates. A gently curving conveyor belt carries round pastel plates with chunky, kid-friendly clay sushi: tamago egg nigiri with a seaweed band, a curled pink-and-white shrimp nigiri, a gunkan topped with corn kernels, a cucumber hand roll, a salmon nigiri, and one small pudding cup. Two plates stacked beside him, one with a gold rim.",
  "Subjects fully inside a central 4:3 safe frame (the export is a 4:3 cover). Leave a little air around the car so a mild crop still keeps the wheels.",
  "Soft pink/peach/mint pastel glow, cream counter, a striped awning, cotton candy clouds; NO royal-blue flat wall, NO high-saturation photo look.",
  "NO toothbrush, NO chopsticks held by anyone, NO raw-meat close-ups, NO knives. Hosts Bonbon/Mami NOT in frame. No text/letters/numbers/logos/watermarks.",
  CLAY_NEGATIVE,
].join(" ");

type CoverManifest = {
  runId: string;
  createdAt: string;
  model: string;
  apiSize: string;
  apiCalls: number;
  referencePaths: readonly string[];
  sha256: string;
  prompt: string;
};

const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");
const displayPath = (filePath: string): string => relative(ROOT, filePath) || ".";

function validateRunId(runId: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(runId)) throw new Error(`run-id 格式無效：${runId}`);
  return runId;
}

function latestRunId(): string {
  const runs = existsSync(STAGING_ROOT)
    ? readdirSync(STAGING_ROOT, { withFileTypes: true })
        .filter((e) => e.isDirectory() && existsSync(join(STAGING_ROOT, e.name, "manifest.json")))
        .map((e) => e.name)
        .sort()
    : [];
  const latest = runs.at(-1);
  if (!latest) throw new Error("staging 內沒有可 approve 的 run；請先執行生成。");
  return latest;
}

function requireApiKey(): void {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key.endsWith("...")) {
    throw new Error("缺有效的 OPENAI_API_KEY（.env.local）；本 script 僅限本機執行。");
  }
}

async function generateRawCover(): Promise<Buffer> {
  requireApiKey();
  const missing = REFERENCE_PATHS.filter((p) => !existsSync(p));
  if (missing.length > 0) throw new Error(`缺少參考圖：${missing.map(displayPath).join("、")}`);
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const files = await Promise.all(
    REFERENCE_PATHS.map(async (p, i) =>
      // 參考圖一律轉成 PNG 送出（webp 不一定被接受）
      toFile(await sharp(p).png().toBuffer(), `ref${i}.png`, { type: "image/png" }),
    ),
  );
  const response = await client.images.edit({ model: getImageModel(), image: files, prompt: COVER_PROMPT, size: API_SIZE });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new Error("圖像模型未回傳影像");
  return Buffer.from(base64, "base64");
}

/** 新封面放第一格，與另外三張封面排成 2×2，模擬遊樂園四張卡。 */
async function writeContactSheet(runDir: string, cover: Buffer): Promise<string> {
  const tile = { width: 724, height: 543 };
  const tiles = await Promise.all(
    [cover, ...SIBLING_COVERS.filter((p) => existsSync(p))].map((input) =>
      sharp(input).resize(tile.width, tile.height, { fit: "cover" }).png().toBuffer(),
    ),
  );
  const out = join(runDir, "contact-sheet.jpg");
  await sharp({ create: { width: tile.width * 2 + 12, height: tile.height * 2 + 12, channels: 3, background: "#ffffff" } })
    .composite(tiles.map((input, i) => ({ input, left: (i % 2) * (tile.width + 12), top: Math.floor(i / 2) * (tile.height + 12) })))
    .jpeg({ quality: 88 })
    .toFile(out);
  return out;
}

async function runGenerate(): Promise<void> {
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(STAGING_ROOT, runId);
  mkdirSync(runDir, { recursive: true });
  console.log(`→ images.edit（${API_SIZE}，API 呼叫 1/${MAX_API_CALLS}）…`);
  const raw = await generateRawCover();
  const cover = await sharp(raw)
    .resize(COVER_SIZE.width, COVER_SIZE.height, { fit: "cover" })
    .webp({ quality: COVER_WEBP_QUALITY })
    .toBuffer();
  writeFileSync(join(runDir, "cover.raw.png"), raw);
  writeFileSync(join(runDir, "cover.webp"), cover);
  const contact = await writeContactSheet(runDir, cover);
  const manifest: CoverManifest = {
    runId,
    createdAt: new Date().toISOString(),
    model: getImageModel(),
    apiSize: API_SIZE,
    apiCalls: 1,
    referencePaths: REFERENCE_PATHS.map(displayPath),
    sha256: sha256(cover),
    prompt: COVER_PROMPT,
  };
  writeFileSync(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`✓ staging：${displayPath(runDir)}\n  併排審稿：${displayPath(contact)}\n  sha256：${manifest.sha256}`);
  console.log(`\n請人工審圖；通過後：npm run generate:dino-sushi-cover -- --approve --run ${runId}`);
}

function runApprove(runId: string): void {
  const runDir = join(STAGING_ROOT, validateRunId(runId));
  const manifest = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8")) as CoverManifest;
  const staged = join(runDir, "cover.webp");
  const actual = sha256(readFileSync(staged));
  if (actual !== manifest.sha256) throw new Error(`approve 拒絕：sha256 不符（manifest=${manifest.sha256}，目前=${actual}）`);
  mkdirSync(dirname(TARGET_COVER), { recursive: true });
  copyFileSync(staged, TARGET_COVER);
  console.log(`✓ approve：${displayPath(staged)} → ${displayPath(TARGET_COVER)}（sha256 已核對）`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const runIndex = args.indexOf("--run");
  const runId = runIndex === -1 ? null : args[runIndex + 1];
  if (runIndex !== -1 && (!runId || runId.startsWith("-"))) throw new Error("--run 後面需要接 run-id。");
  if (args.includes("--approve")) return runApprove(runId ?? latestRunId());
  if (runId) throw new Error("--run 僅能搭配 --approve 使用。");
  if (args.includes("--dry-run")) {
    console.log(`模式：dry-run（不呼叫 API）\n模型：${getImageModel()}\n尺寸：${API_SIZE}\n上限：${MAX_API_CALLS} 次`);
    console.log(`參考圖：\n${REFERENCE_PATHS.map((p) => `  - ${displayPath(p)}`).join("\n")}`);
    console.log(`staging：${displayPath(STAGING_ROOT)}/<run-id>/\n正式目標（approve 才覆蓋）：${displayPath(TARGET_COVER)}\n\nPrompt：\n${COVER_PROMPT}`);
    return;
  }
  await runGenerate();
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
