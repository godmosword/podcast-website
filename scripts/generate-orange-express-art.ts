#!/usr/bin/env tsx
/**
 * 生成「小橘特快車」的黏土風遊樂園封面與小橘貼紙（做法同 generate-dino-sushi-cover.ts）。
 *
 *   npm run generate:orange-express-art -- --dry-run            # 只印 prompt 與路徑，不呼叫 API
 *   npm run generate:orange-express-art                         # 封面 1 張＋貼紙 1 張到 public/.games-staging/orange-express/<run-id>/
 *   npm run generate:orange-express-art -- --only cover         # 只生其中一張（cover 或 sticker）
 *   npm run generate:orange-express-art -- --approve [--run <run-id>]   # 人工審圖後才放進正式位置
 *
 * 張數與 prompt 已在 2026-10-28 確認（docs/plans/2026-10-28-orange-express-art-batch2.md 最後一節）：
 * 封面 1 張、貼紙 1 張，各 1 輪。
 * 紅線：付費生圖，每次執行每張最多 1 次 API 呼叫、不自動重抽；不滿意要重抽先列張數等確認。
 * 未經人工審稿不得上線；CI 不放 OPENAI_API_KEY。
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import sharp from "sharp";
import { getImageModel } from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const PUBLIC_DIR = join(ROOT, "public");
const STAGING_ROOT = join(PUBLIC_DIR, ".games-staging", "orange-express");
const CHARACTER_REF = join(PUBLIC_DIR, "characters/小橘高鐵.jpg");
const HUB_REF = join(PUBLIC_DIR, "games/v2/hub/hero-desktop.webp");

/** 透明底只有 gpt-image-1.5 這一代支援（gpt-image-2 不支援，見 generate-zone-night-art.ts）。 */
const STICKER_MODEL = "gpt-image-1.5";

type ArtId = "cover" | "sticker";

type ArtSpec = {
  id: ArtId;
  model: () => string;
  size: "1536x1024" | "1024x1024";
  transparent: boolean;
  references: readonly string[];
  staged: string;
  targets: readonly { path: string; width?: number }[];
  prompt: string;
};

const SPECS: Record<ArtId, ArtSpec> = {
  cover: {
    id: "cover",
    model: getImageModel,
    size: "1536x1024",
    transparent: false,
    references: [HUB_REF, CHARACTER_REF],
    staged: "cover.webp",
    targets: [{ path: join(PUBLIC_DIR, "games/v2/orange-express/cover.webp") }],
    prompt:
      "Children's picture-book illustration in soft claymation / plasticine stop-motion style, matching the attached park hero: rounded clay shapes, smooth matte surfaces, soft studio light, gentle shadows, pastel palette on a clean off-white sky. " +
      "The character 小橘 from the second reference image, kept on-model but as a short, chubby toy: one single rounded car only, a cream-white body, a dark rounded windshield cap on top of the nose, a short smooth bullet nose, big round eyes on the front of the nose just below the windshield cap, pink cheeks, a gentle smile, one bold orange stripe that runs diagonally from under the face back along the side, dark grey lower body. " +
      "No pantograph, no thin dark line under the orange stripe. " +
      "Three-quarter front view, 小橘 coming toward the viewer around a gentle curve on a clay track through soft green hills, a small clay platform with a yellow edge line on the left, the amusement-park ferris wheel small in the far background. " +
      "Keep the lower right corner calm and simple (a small round badge will sit there). " +
      "Absolutely no arms, hands or limbs on the train. No station signs, no text, no letters, no numbers, no logos, no real railway markings or liveries beyond the character's own colors. No people. No photorealism. " +
      "Leave soft sky at the top so the image can be cropped shorter.",
  },
  sticker: {
    id: "sticker",
    model: () => STICKER_MODEL,
    size: "1024x1024",
    transparent: true,
    references: [CHARACTER_REF],
    staged: "xiaoju-sticker.webp",
    targets: [
      { path: join(PUBLIC_DIR, "games/v2/orange-express/xiaoju-sticker.webp") },
      { path: join(PUBLIC_DIR, "games/v2/orange-express/sm/xiaoju-sticker.webp"), width: 256 },
    ],
    prompt:
      "A single claymation sticker of the character 小橘 from the reference image, kept on-model as a short, chubby toy: one single rounded car, cream-white body, a dark rounded windshield cap on top of the nose, a short smooth bullet nose, big round eyes on the front of the nose just below the windshield cap, pink cheeks, happy open smile, one bold orange stripe running diagonally from under the face back along the side, dark grey lower body. " +
      "The face is large and fills most of the front so it still reads at 48 pixels. " +
      "Three-quarter front view facing right. Soft matte plasticine texture, soft top-left light, gentle contact shadow only. Transparent background, clean edges, centered with padding. " +
      "No pantograph, no thin dark line under the orange stripe. Absolutely no arms, hands or limbs. No track, no platform, no text, no letters, no numbers, no logos.",
  },
};

/** 封面併排審稿：遊樂園另外三張封面。 */
const SIBLING_COVERS = ["coloring-book", "candy-match", "dino-sushi"].map((slug) =>
  join(PUBLIC_DIR, `games/v2/${slug}/cover.webp`),
);

type ArtManifest = {
  runId: string;
  createdAt: string;
  items: { id: ArtId; model: string; size: string; apiCalls: number; references: string[]; sha256: string; prompt: string }[];
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

/** 呼叫一次 images.edit。透明底的貼紙要用支援 background 的那一代模型。 */
async function generateRaw(spec: ArtSpec): Promise<Buffer> {
  const missing = spec.references.filter((p) => !existsSync(p));
  if (missing.length > 0) throw new Error(`缺少參考圖：${missing.map(displayPath).join("、")}`);
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const files = await Promise.all(
    spec.references.map(async (p, i) =>
      // 參考圖一律轉成 PNG 送出（webp 不一定被接受）
      toFile(await sharp(p).png().toBuffer(), `ref${i}.png`, { type: "image/png" }),
    ),
  );
  const response = await client.images.edit({
    model: spec.model(),
    image: files,
    prompt: spec.prompt,
    size: spec.size,
    ...(spec.transparent ? { background: "transparent" as const, input_fidelity: "high" as const } : {}),
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new Error(`圖像模型未回傳 ${spec.id}`);
  return Buffer.from(base64, "base64");
}

async function finish(spec: ArtSpec, raw: Buffer): Promise<Buffer> {
  if (!spec.transparent) return sharp(raw).webp({ quality: 90 }).toBuffer();
  const { channels } = await sharp(raw).metadata();
  if (channels !== 4) throw new Error("貼紙沒有透明底（模型回傳實底）；不要直接用，先回報。");
  return sharp(raw).trim().webp({ quality: 90, alphaQuality: 100 }).toBuffer();
}

/** 封面放第一格，與另外三張排成 2×2；貼紙放大、120px、48px 各一，淺底深底各一列。 */
async function writeContactSheet(runDir: string, made: Partial<Record<ArtId, Buffer>>): Promise<string[]> {
  const out: string[] = [];
  if (made.cover) {
    const tile = { width: 724, height: 483 };
    const tiles = await Promise.all(
      [made.cover, ...SIBLING_COVERS.filter((p) => existsSync(p))].map((input) =>
        sharp(input).resize(tile.width, tile.height, { fit: "cover" }).png().toBuffer(),
      ),
    );
    const path = join(runDir, "contact-cover.jpg");
    await sharp({ create: { width: tile.width * 2 + 12, height: tile.height * 2 + 12, channels: 3, background: "#ffffff" } })
      .composite(tiles.map((input, i) => ({ input, left: (i % 2) * (tile.width + 12), top: Math.floor(i / 2) * (tile.height + 12) })))
      .jpeg({ quality: 88 })
      .toFile(path);
    out.push(path);
  }
  if (made.sticker) {
    const sizes = [400, 120, 48];
    const rowHeight = 420;
    const layers: sharp.OverlayOptions[] = [];
    for (const [row, bg] of [
      [0, { r: 255, g: 247, b: 237 }],
      [1, { r: 46, g: 38, b: 52 }],
    ] as const) {
      layers.push({
        input: await sharp({ create: { width: 640, height: rowHeight, channels: 3, background: bg } }).png().toBuffer(),
        left: 0,
        top: row * rowHeight,
      });
      let left = 10;
      for (const size of sizes) {
        layers.push({
          input: await sharp(made.sticker).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
          left,
          top: row * rowHeight + 10,
        });
        left += size + 20;
      }
    }
    const path = join(runDir, "contact-sticker.png");
    await sharp({ create: { width: 640, height: rowHeight * 2, channels: 3, background: "#ffffff" } }).composite(layers).png().toFile(path);
    out.push(path);
  }
  return out;
}

async function runGenerate(ids: readonly ArtId[]): Promise<void> {
  requireApiKey();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(STAGING_ROOT, runId);
  mkdirSync(runDir, { recursive: true });
  const manifest: ArtManifest = { runId, createdAt: new Date().toISOString(), items: [] };
  const made: Partial<Record<ArtId, Buffer>> = {};
  for (const id of ids) {
    const spec = SPECS[id];
    console.log(`→ ${id}：images.edit（${spec.model()}，${spec.size}，API 呼叫 1/1）…`);
    const raw = await generateRaw(spec);
    writeFileSync(join(runDir, `${id}.raw.png`), raw);
    const art = await finish(spec, raw);
    writeFileSync(join(runDir, spec.staged), art);
    made[id] = art;
    manifest.items.push({
      id,
      model: spec.model(),
      size: spec.size,
      apiCalls: 1,
      references: spec.references.map(displayPath),
      sha256: sha256(art),
      prompt: spec.prompt,
    });
  }
  writeFileSync(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  const sheets = await writeContactSheet(runDir, made);
  console.log(`✓ staging：${displayPath(runDir)}`);
  for (const sheet of sheets) console.log(`  併排審稿：${displayPath(sheet)}`);
  console.log(`\n請人工審圖；通過後：npm run generate:orange-express-art -- --approve --run ${runId}`);
}

async function runApprove(runId: string): Promise<void> {
  const runDir = join(STAGING_ROOT, validateRunId(runId));
  const manifest = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8")) as ArtManifest;
  for (const item of manifest.items) {
    const spec = SPECS[item.id];
    const staged = join(runDir, spec.staged);
    const buffer = readFileSync(staged);
    if (sha256(buffer) !== item.sha256) throw new Error(`approve 拒絕：${item.id} 的 sha256 跟 manifest 不符`);
    for (const target of spec.targets) {
      mkdirSync(dirname(target.path), { recursive: true });
      if (target.width) {
        await sharp(buffer).resize({ width: target.width }).webp({ quality: 86, alphaQuality: 100 }).toFile(target.path);
      } else {
        copyFileSync(staged, target.path);
      }
      console.log(`✓ approve：${displayPath(staged)} → ${displayPath(target.path)}`);
    }
  }
  console.log("\n記得登記 public/games/v2/orange-express/SOURCES.md，並把 data/games.ts 的封面改指新的 webp。");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const runIndex = args.indexOf("--run");
  const runId = runIndex === -1 ? null : args[runIndex + 1];
  if (runIndex !== -1 && (!runId || runId.startsWith("-"))) throw new Error("--run 後面需要接 run-id。");
  if (args.includes("--approve")) return runApprove(runId ?? latestRunId());
  if (runId) throw new Error("--run 僅能搭配 --approve 使用。");
  const onlyIndex = args.indexOf("--only");
  const only = onlyIndex === -1 ? null : args[onlyIndex + 1];
  if (only !== null && only !== "cover" && only !== "sticker") throw new Error("--only 只接 cover 或 sticker。");
  const ids: ArtId[] = only ? [only] : ["cover", "sticker"];
  if (args.includes("--dry-run")) {
    console.log(`模式：dry-run（不呼叫 API）\nstaging：${displayPath(STAGING_ROOT)}/<run-id>/`);
    for (const id of ids) {
      const spec = SPECS[id];
      console.log(`\n[${id}] 模型 ${spec.model()}，${spec.size}${spec.transparent ? "，透明底" : ""}，1 張`);
      console.log(`參考圖：${spec.references.map(displayPath).join("、")}`);
      console.log(`正式位置（approve 才寫）：${spec.targets.map((t) => displayPath(t.path)).join("、")}`);
      console.log(`Prompt：\n${spec.prompt}`);
    }
    return;
  }
  await runGenerate(ids);
}

main().catch((error: unknown) => {
  console.error(`✗ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
