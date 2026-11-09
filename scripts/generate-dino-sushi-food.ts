#!/usr/bin/env tsx
/**
 * 多多壽司屋食材重畫（計畫 docs/plans/2026-11-08-dino-sushi-real-shop.md，PR-B）。
 * 第一輪：軍艦、手捲（飯底）與鮪魚沙拉，換掉不像真的那三張。
 *
 *   npm run generate:dino-sushi-food -- --dry-run [--only gunkan,temaki]   # 只印 prompt、參考圖與路徑
 *   npm run generate:dino-sushi-food [--only gunkan]                        # 每個 slug 1 次 API，暫存到 staging
 *   npm run generate:dino-sushi-food -- --approve --run <run-id> [--only gunkan]  # 審過 contact sheet 才覆蓋正式檔
 *
 * 紅線：付費生圖。每次執行每個 slug 最多 1 次呼叫、不自動重抽（逾時同張最多再試 1 次）；
 * 重抽要先在聊天列 slug 與張數、等文字確認。未經人工審稿不得上線；CI 不放 OPENAI_API_KEY。
 * 模型固定 gpt-image-1.5：gpt-image-2 不支援透明底，現有食材也是 1.5 生的，質感才接得上。
 * 手捲的前片（蓋在料上的那片海苔）在核可後從同一張圖切（scripts/cut-dino-sushi-front.ts），不另外生圖。
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";
import { ROOT } from "./lib/transcribe-core";

const FOOD_DIR = join(ROOT, "public/games/v2/dino-sushi/food");
const STAGING_ROOT = join(ROOT, "public/.games-staging/dino-sushi-food");
const MODEL = "gpt-image-1.5";
const WEBP = { quality: 90, alphaQuality: 100 } as const;

/** 跟現有食材一致的畫法：黏土、霧面、俯角約 30°、左上柔光、透明底。 */
const FOOD_STYLE = [
  "A single piece of kid-friendly sushi food art for a children's game, in the same soft claymation / plasticine style as the reference images:",
  "rounded chunky clay forms, smooth matte surfaces with fine clay texture, soft studio light from the top-left, gentle soft shadow on the lower right of each form, low contrast, warm and appetizing colors.",
  "Camera: the same three-quarter top-down view as the references, about 30 degrees above the table, object centered, the whole object inside the frame with a little margin.",
  "Transparent background. No plate, no table, no cast shadow on the ground, no props, no chopsticks.",
].join(" ");

const FOOD_NEGATIVE =
  "No text, no letters, no numbers, no logos, no watermark. No faces, eyes or mouths on the food. No photorealism, no glossy plastic, no velvet or felt fabric look.";

type FoodSpec = {
  slug: "gunkan" | "temaki" | "tuna";
  label: string;
  size: "1024x1024" | "1024x1536";
  /** 第 1 張定風格與飯粒，其餘只參考黏土質感。不要放舊的同名圖，免得照抄錯的形狀。 */
  refs: readonly string[];
  prompt: string;
};

const SPECS: readonly FoodSpec[] = [
  {
    slug: "gunkan",
    label: "軍艦（飯底）",
    size: "1024x1024",
    refs: ["nigiri.webp", "salmon.webp"],
    prompt: [
      "Subject: an EMPTY gunkan-maki (battleship sushi) base, no topping yet, as it looks in a real sushi shop.",
      "An oval of white sushi rice wrapped by ONE thin band of nori seaweed around its side. Long axis horizontal; low and squat: the band is only about 40-45% as tall as the oval is long.",
      "The nori is a single thin sheet: matte deep green-black with a faint sheen and visible paper-like fibres, with one straight vertical seam slightly right of the front. Not thick, not fabric, not a box, no second step or tier, no lid.",
      "Top opening: a wide oval about 80% of the outer width, so we look down into it; the rice surface sits about 10-15% below the nori rim, with rice grains like the reference rice, leaving room for a topping.",
    ].join(" "),
  },
  {
    slug: "temaki",
    label: "手捲（飯底）",
    size: "1024x1536",
    refs: ["nigiri.webp", "cucumber.webp"],
    prompt: [
      "Subject: an EMPTY temaki (hand roll) base, no filling yet, as it looks in a real sushi shop.",
      "A cone of ONE nori sheet rolled diagonally, roughly 1 : 1.5 width to height, tilted at most 15 degrees. One diagonal seam where the sheet overlaps across the front; the back of the cone rises about 15% higher than the front edge.",
      "The nori is matte deep green-black with a faint sheen and paper-like fibres; thin, not fabric, not velvet, not a perfectly symmetric ice-cream cone.",
      "The open top is wide (about 90% of the image width of the cone) and tips slightly toward the camera; it is filled with white sushi rice with a gently domed surface, like the reference rice — NO hole or ring in the rice, leaving room on top for fillings.",
    ].join(" "),
  },
  {
    slug: "tuna",
    label: "鮪魚沙拉",
    size: "1024x1024",
    refs: ["corn.webp", "nigiri.webp"],
    prompt: [
      "Subject: a small scoop of Japanese tuna-mayo salad (ツナマヨ) as a sushi topping, like on a real tuna-mayo gunkan.",
      "Flaked canned tuna, pale beige with a soft pink tint, with visible shredded fibres and small chunks, mixed through with mayonnaise so it has a soft creamy sheen.",
      "A low rounded mound with a flat bottom: height about 45% of its width. A few tiny green scallion bits are fine.",
      "NO piped mayonnaise swirl on top, no cream rosette, no whipped-cream look, no pink rice look.",
    ].join(" "),
  },
];

type Args = { dryRun: boolean; approve: boolean; run: string | null; only: Set<string> | null };

const FLAGS = new Set(["--dry-run", "--approve"]);
const VALUE_FLAGS = new Set(["--run", "--only"]);

/** 打錯、重複或缺值的旗標一律停下來：付費腳本不猜意思。 */
function parseArgs(argv: readonly string[]): Args {
  const seen = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    if (seen.has(flag)) throw new Error(`旗標重複：${flag}`);
    if (FLAGS.has(flag)) seen.set(flag, true);
    else if (VALUE_FLAGS.has(flag)) {
      const value = argv[++i]?.trim();
      if (!value || value.startsWith("--")) throw new Error(`${flag} 後面要接值`);
      seen.set(flag, value);
    } else throw new Error(`不認得的參數：${flag}`);
  }
  if (seen.has("--dry-run") && seen.has("--approve")) throw new Error("--dry-run 與 --approve 不能一起用");
  const only = seen.get("--only");
  const slugs = typeof only === "string" ? only.split(",").map((s) => s.trim()) : null;
  if (slugs?.some((s) => !s)) throw new Error("--only 不能有空的 slug");
  const run = seen.get("--run");
  return {
    dryRun: seen.has("--dry-run"),
    approve: seen.has("--approve"),
    run: typeof run === "string" ? run : null,
    only: slugs ? new Set(slugs) : null,
  };
}

function selectSpecs(only: Set<string> | null): FoodSpec[] {
  if (!only) return [...SPECS];
  const unknown = [...only].filter((slug) => !SPECS.some((s) => s.slug === slug));
  if (unknown.length > 0) throw new Error(`不認得的 slug：${unknown.join("、")}`);
  return SPECS.filter((s) => only.has(s.slug));
}

const fullPrompt = (spec: FoodSpec): string => [FOOD_STYLE, spec.prompt, FOOD_NEGATIVE].join(" ");
const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");
const display = (p: string): string => relative(ROOT, p) || ".";

function requireApiKey(): void {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key.endsWith("...")) {
    throw new Error("缺有效的 OPENAI_API_KEY（.env.local）；本 script 僅限本機執行。");
  }
}

async function callImageApi(spec: FoodSpec): Promise<Buffer> {
  const { default: OpenAI, toFile } = await import("openai");
  // SDK 預設會自己重試；關掉，重試次數只由 generateOnce 決定（同張最多 2 次）
  const client = new OpenAI({ maxRetries: 0 });
  const files = await Promise.all(
    spec.refs.map(async (name, i) =>
      toFile(await sharp(join(FOOD_DIR, name)).png().toBuffer(), `ref${i}.png`, { type: "image/png" }),
    ),
  );
  const response = await client.images.edit({
    model: MODEL,
    image: files,
    prompt: fullPrompt(spec),
    size: spec.size,
    quality: "high",
    background: "transparent",
    output_format: "png",
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new Error(`${spec.slug}：圖像模型未回傳影像`);
  return Buffer.from(base64, "base64");
}

/** 逾時或連線中斷才再試一次（同一張、同一個 prompt）；其他錯誤直接停。 */
async function generateOnce(spec: FoodSpec): Promise<{ raw: Buffer; calls: number }> {
  try {
    return { raw: await callImageApi(spec), calls: 1 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "";
    // 只有逾時才再試（紅線）；斷線、429、5xx 都直接停，等人決定
    if (name !== "APIConnectionTimeoutError" && !/timed? ?out/i.test(message)) throw error;
    console.warn(`  ${spec.slug} 逾時，同一張再試 1 次：${message}`);
    return { raw: await callImageApi(spec), calls: 2 };
  }
}

async function toTrimmedWebp(raw: Buffer): Promise<Buffer> {
  return sharp(raw).trim({ threshold: 1 }).webp(WEBP).toBuffer();
}

/** 每列：舊圖｜新圖，放在奶油底上，跟遊戲裡看起來一樣。 */
async function writeContactSheet(runDir: string, specs: readonly FoodSpec[]): Promise<string> {
  const cell = 360;
  const bg = { r: 251, g: 241, b: 225, alpha: 1 };
  const tile = (input: string | Buffer) =>
    sharp(input).resize(cell - 24, cell - 24, { fit: "contain", background: bg }).flatten({ background: bg }).png().toBuffer();
  const rows = await Promise.all(
    specs.map(async (spec) => [await tile(join(FOOD_DIR, `${spec.slug}.webp`)), await tile(join(runDir, `${spec.slug}.webp`))]),
  );
  const composites = rows.flatMap((pair, r) => pair.map((input, c) => ({ input, left: c * cell + 12, top: r * cell + 12 })));
  const out = join(runDir, "contact-sheet.jpg");
  await sharp({ create: { width: cell * 2, height: cell * rows.length, channels: 3, background: "#ffffff" } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(out);
  return out;
}

async function runGenerate(specs: readonly FoodSpec[]): Promise<void> {
  requireApiKey();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(STAGING_ROOT, runId);
  mkdirSync(runDir, { recursive: true });
  const entries: Record<string, unknown>[] = [];
  const done: FoodSpec[] = [];
  /* 每生好一張就寫一次 manifest：後面那張失敗時，已付費的這幾張仍可審、可核可，不必重生 */
  const saveManifest = () =>
    writeFileSync(
      join(runDir, "manifest.json"),
      `${JSON.stringify({ runId, createdAt: new Date().toISOString(), model: MODEL, entries }, null, 2)}\n`,
    );
  try {
    for (const [i, spec] of specs.entries()) {
      console.log(`→ ${spec.slug}（${spec.label}）images.edit ${spec.size}，第 ${i + 1}/${specs.length} 張…`);
      const { raw, calls } = await generateOnce(spec);
      const webp = await toTrimmedWebp(raw);
      writeFileSync(join(runDir, `${spec.slug}.raw.png`), raw);
      writeFileSync(join(runDir, `${spec.slug}.webp`), webp);
      entries.push({ slug: spec.slug, size: spec.size, refs: spec.refs, apiCalls: calls, sha256: sha256(webp), prompt: fullPrompt(spec) });
      done.push(spec);
      saveManifest();
    }
  } finally {
    if (done.length > 0) await writeContactSheet(runDir, done);
  }
  const contact = join(runDir, "contact-sheet.jpg");
  console.log(`✓ 暫存：${display(runDir)}`);
  console.log(`  審稿：${display(contact)}（左舊右新）。核可後：npm run generate:dino-sushi-food -- --approve --run ${runId}`);
}

type Manifest = { runId: string; model: string; entries: { slug: string; sha256: string }[] };

/** 先把要核可的每一張都驗過（run、模型、hash），全部通過才開始覆蓋，不會只換一半。 */
function verifiedStaged(runId: string, specs: readonly FoodSpec[]): string[] {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(runId)) throw new Error(`run-id 格式無效：${runId}`);
  const runDir = join(STAGING_ROOT, runId);
  const manifest = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8")) as Manifest;
  if (manifest.runId !== runId || manifest.model !== MODEL) throw new Error(`${runId} 的 manifest 對不上（run 或模型）`);
  return specs.map((spec) => {
    const entry = manifest.entries.find((e) => e.slug === spec.slug);
    if (!entry || !/^[0-9a-f]{64}$/.test(entry.sha256)) throw new Error(`${runId} 沒有 ${spec.slug} 的生成紀錄`);
    const staged = join(runDir, `${spec.slug}.webp`);
    if (!existsSync(staged) || sha256(readFileSync(staged)) !== entry.sha256) throw new Error(`${spec.slug} 暫存檔與 manifest 不符`);
    return staged;
  });
}

function runApprove(runId: string, specs: readonly FoodSpec[]): void {
  const staged = verifiedStaged(runId, specs);
  for (const [i, spec] of specs.entries()) {
    copyFileSync(staged[i]!, join(FOOD_DIR, `${spec.slug}.webp`));
    console.log(`✓ ${spec.slug} → ${display(join(FOOD_DIR, `${spec.slug}.webp`))}`);
  }
  console.log("接著：切手捲前片（scripts/cut-dino-sushi-front.ts）、npm run optimize:dino-sushi-assets、調 art.tsx 錨點，更新 SOURCES.md。");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const specs = selectSpecs(args.only);
  if (args.approve) {
    // 一定要指定審過的那次 run，不猜「最新的一次」
    if (!args.run) throw new Error("--approve 要加 --run <審過的 run-id>");
    return runApprove(args.run, specs);
  }
  if (args.dryRun) {
    for (const spec of specs) {
      console.log(`\n## ${spec.slug}（${spec.label}）${spec.size}，參考圖：${spec.refs.join("、")}\n${fullPrompt(spec)}`);
    }
    console.log(`\n共 ${specs.length} 次 API 呼叫（${MODEL}，透明底 PNG）。--dry-run 不呼叫。`);
    return;
  }
  await runGenerate(specs);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
