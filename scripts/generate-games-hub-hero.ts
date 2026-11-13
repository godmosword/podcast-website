#!/usr/bin/env tsx
/**
 * 遊樂園大海報重畫（TODOS「遊樂園大海報仍畫著堆方塊」，T5）：四塊招牌換成現役四款
 * （繪本塗塗鴉、車車消消樂、多多壽司屋、小橘特快車），堆方塊的招牌拿掉。
 *
 *   npm run generate:games-hub-hero -- --dry-run --only desktop   # 只印 prompt 與參考圖
 *   npm run generate:games-hub-hero -- --only desktop             # 1 次 API，暫存到 staging
 *   npm run generate:games-hub-hero -- --approve --run <run-id> --only desktop  # 審過才覆蓋正式檔
 *
 * 先做桌機、核可後再做手機（手機用核可的桌機當參考圖重新構圖），所以一次只做一張。
 * 紅線：付費生圖。每次執行每張最多 1 次呼叫（逾時同張最多再試 1 次）、不自動重抽；
 * 重抽要先在聊天列張數、等文字確認。未經人工審稿不得上線；CI 不放 OPENAI_API_KEY。
 *
 * 參考圖取自正式檔，生圖前先複製進 run 目錄的 refs/、manifest 記 sha256，事後照原參考可重現。
 * 2026-11-13 上線後正式桌機已是四塊招牌：桌機提示詞仍要求 FOUR，重跑可用；手機的 image 1
 * 永遠是當下的正式桌機，所以桌機要重畫時，一定先核可桌機、再生手機。
 */
import { createHash, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import sharp from "sharp";
import { getImageModel } from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const HUB_DIR = join(ROOT, "public/games/v2/hub");
const STAGING_ROOT = join(ROOT, "public/.games-staging/games-hub-hero");
const CHAR_DIR = join(ROOT, "public/characters");
/** 手機（≤640px）只露出 16:9、垂直位置 42% 的一條；跟 app/games/page.module.css 的 object-position 同步。 */
const MOBILE_FOCUS_Y = 0.42;

type Slug = "desktop" | "mobile";
type HeroSpec = {
  slug: Slug;
  apiSize: "1536x1024" | "1024x1536";
  /** 正式檔尺寸（跟現在上線的一樣，頁面的 width／height 不用改）。 */
  out: { width: number; height: number };
  refs: () => string[];
  prompt: string;
};

const STYLE = [
  "Children's picture-book illustration in soft claymation / plasticine stop-motion style, matching image 1 exactly:",
  "rounded friendly clay shapes, smooth matte surfaces, soft studio lighting, gentle shadows,",
  "pastel palette (blush pink, warm yellow, fresh mint, sky blue, teal, lilac) under a clean off-white sky with small clay clouds and stars.",
].join(" ");

/**
 * 四塊招牌，只有圖、沒有字。順序＝遊樂園卡片的順序。
 * trainImage＝小橘高鐵在該規格參考圖裡是第幾張（桌機第 4 張、手機第 3 張）。
 */
const signs = (trainImage: number): string =>
  [
    "1) pink sign: a chunky pink crayon drawing on an open coloring book;",
    "2) yellow sign: three identical little yellow cars in a row with two curved arrows swapping the first two;",
    "3) mint sign: one salmon nigiri sushi on a small round plate, as a simple clay icon;",
    `4) sky-blue sign: a small cream-white bullet train with one orange stripe (the train character from image ${trainImage}, as a tiny clay icon) on a short piece of track.`,
  ].join(" ");

const NEGATIVE = [
  "Exactly FOUR signposts; no falling blocks, no tetris-like blocks anywhere.",
  "No text, no words, no letters, no numbers except the \"2\" on the red race car, no captions, no logos, no watermark.",
  "No realistic humans. No photorealism.",
].join(" ");

const DESKTOP: HeroSpec = {
  slug: "desktop",
  apiSize: "1536x1024",
  out: { width: 1672, height: 941 },
  refs: () => [
    join(HUB_DIR, "hero-desktop.webp"),
    join(CHAR_DIR, "恐龍車多多.jpg"),
    join(CHAR_DIR, "小紅賽車.jpg"),
    join(CHAR_DIR, "小橘高鐵.jpg"),
  ],
  prompt: [
    STYLE,
    "Image 1 is the existing park hero: keep the same rainbow entrance archway with the star, the ferris wheel, the carousel, the clay bushes, flowers and the winding clay road, the same light and camera.",
    "Image 2 is the green dinosaur car 恐龍車多多 and image 3 is the red race car 小紅賽車 with the number 2: keep both exactly on-model, sitting on the road near the bottom, facing the viewer, happy, the same size and place as in image 1.",
    `Change ONLY the signposts: instead of three, place FOUR wooden clay signposts with round pastel signs, spread evenly left to right across the scene at the same height, each showing only a picture: ${signs(4)}`,
    "The final image is cropped to 16:9: keep all four signs, the arch and both cars inside the central band; the top and bottom 8% may be cut off.",
    NEGATIVE,
  ].join(" "),
};

const MOBILE: HeroSpec = {
  slug: "mobile",
  apiSize: "1024x1536",
  out: { width: 940, height: 1410 },
  refs: () => [join(HUB_DIR, "hero-desktop.webp"), join(HUB_DIR, "hero-mobile.webp"), join(CHAR_DIR, "小橘高鐵.jpg")],
  prompt: [
    STYLE,
    "Image 1 is the approved desktop version of this scene (with four picture signs): reuse exactly its claymation style, palette, characters, signs and park elements, but recompose them for a tall phone frame like image 2.",
    "Composition: soft pastel sky in the top 15%; then the rainbow archway with the star and the ferris wheel behind it.",
    `Directly in front of the arch, the FOUR round picture signs in ONE horizontal row across the full width, large and clear: ${signs(3)}`,
    "Phones crop this image to a 16:9 band centred at 42% of its height, so the arch and the four signs must sit between 23% and 61% of the height.",
    "Below the signs the wide clay road comes toward the viewer and exits at the bottom centre; the green dinosaur car and the red race car with the number 2 sit on the road side by side facing the viewer, as in image 2. Clay bushes and flowers at the sides.",
    NEGATIVE,
  ].join(" "),
};

const SPECS: Readonly<Record<Slug, HeroSpec>> = { desktop: DESKTOP, mobile: MOBILE };

type Args = { dryRun: boolean; approve: boolean; run: string | null; only: Slug };

/** 打錯、重複或缺值的旗標一律停：付費腳本不猜意思。一次只做一張，所以 --only 必填。 */
function parseArgs(argv: readonly string[]): Args {
  const seen = new Map<string, string | true>();
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i]!;
    if (seen.has(flag)) throw new Error(`旗標重複：${flag}`);
    if (flag === "--dry-run" || flag === "--approve") seen.set(flag, true);
    else if (flag === "--run" || flag === "--only") {
      const value = argv[++i]?.trim();
      if (!value || value.startsWith("--")) throw new Error(`${flag} 後面要接值`);
      seen.set(flag, value);
    } else throw new Error(`不認得的參數：${flag}`);
  }
  if (seen.has("--dry-run") && seen.has("--approve")) throw new Error("--dry-run 與 --approve 不能一起用");
  // 生圖時給 --run 會被忽略、照樣付費；不讓人誤以為是在挑舊的 run
  if (seen.has("--run") && !seen.has("--approve")) throw new Error("--run 只能跟 --approve 一起用");
  const only = seen.get("--only");
  if (only !== "desktop" && only !== "mobile") throw new Error("要指定 --only desktop 或 --only mobile（一次一張）");
  const run = seen.get("--run");
  return { dryRun: seen.has("--dry-run"), approve: seen.has("--approve"), run: typeof run === "string" ? run : null, only };
}

const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");
const display = (p: string): string => relative(ROOT, p) || ".";

function requireApiKey(): void {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key.endsWith("...")) throw new Error("缺有效的 OPENAI_API_KEY（.env.local）；本 script 僅限本機執行。");
}

async function callImageApi(spec: HeroSpec, refs: readonly string[]): Promise<Buffer> {
  const { default: OpenAI, toFile } = await import("openai");
  // SDK 預設會自己重試；關掉，重試次數只由 generateOnce 決定
  const client = new OpenAI({ maxRetries: 0 });
  // 檔名跟提示詞的 image N 一樣從 1 起算
  const files = await Promise.all(
    refs.map(async (p, i) => toFile(await sharp(p).png().toBuffer(), `ref${i + 1}.png`, { type: "image/png" })),
  );
  const response = await client.images.edit({
    model: getImageModel(),
    image: files,
    prompt: spec.prompt,
    size: spec.apiSize,
    quality: "high",
    output_format: "png",
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new Error(`${spec.slug}：圖像模型未回傳影像`);
  return Buffer.from(base64, "base64");
}

/** 只有逾時才同一張再試一次；斷線、429、5xx 都直接停。 */
async function generateOnce(spec: HeroSpec, refs: readonly string[]): Promise<{ raw: Buffer; calls: number }> {
  try {
    return { raw: await callImageApi(spec, refs), calls: 1 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const name = error instanceof Error ? error.name : "";
    if (name !== "APIConnectionTimeoutError" && !/timed? ?out/i.test(message)) throw error;
    console.warn(`  ${spec.slug} 逾時，同一張再試 1 次（前一次可能已計費）：${message}`);
    return { raw: await callImageApi(spec, refs), calls: 2 };
  }
}

/** 裁成正式檔的比例（置中），再縮放到正式尺寸。 */
async function toFinal(spec: HeroSpec, raw: Buffer): Promise<Buffer> {
  const final = await sharp(raw).resize(spec.out.width, spec.out.height, { fit: "cover", position: "centre" }).png().toBuffer();
  const { width, height } = await sharp(final).metadata();
  if (width !== spec.out.width || height !== spec.out.height) {
    throw new Error(`hero-${spec.slug} 尺寸 ${width}×${height}，應為 ${spec.out.width}×${spec.out.height}`);
  }
  return final;
}

/** 手機實際露出的那一條（16:9、垂直 MOBILE_FOCUS_Y），跟頁面的 object-position 同一個算法。 */
async function phoneBand(input: Buffer): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(input).metadata();
  const bandH = Math.round((width * 9) / 16);
  const top = Math.max(0, Math.min(height - bandH, Math.round(height * MOBILE_FOCUS_Y - bandH / 2)));
  return sharp(input).extract({ left: 0, top, width, height: bandH }).png().toBuffer();
}

/** 左舊、中新；手機版右邊再放新圖在手機上實際露出的那一條。 */
async function writeContactSheet(runDir: string, spec: HeroSpec, final: Buffer): Promise<string> {
  const h = spec.slug === "desktop" ? 470 : 700;
  const tile = (input: string | Buffer) => sharp(input).resize({ height: h }).png().toBuffer();
  const sources: (string | Buffer)[] = [join(HUB_DIR, `hero-${spec.slug}.webp`), final];
  if (spec.slug === "mobile") sources.push(await phoneBand(final));
  const tiles = await Promise.all(sources.map(tile));
  const widths = await Promise.all(tiles.map(async (t) => (await sharp(t).metadata()).width ?? 0));
  const lefts = widths.map((_, i) => widths.slice(0, i).reduce((sum, w) => sum + w + 12, 0));
  const out = join(runDir, "contact-sheet.jpg");
  await sharp({ create: { width: lefts.at(-1)! + widths.at(-1)!, height: h, channels: 3, background: "#ffffff" } })
    .composite(tiles.map((input, i) => ({ input, left: lefts[i]!, top: 0 })))
    .jpeg({ quality: 88 })
    .toFile(out);
  return out;
}

/** 參考圖複製進 run 目錄（正式檔之後會被核可蓋掉），回傳複製後的路徑與 hash。 */
function freezeRefs(runDir: string, refs: readonly string[]): { source: string; frozen: string; sha256: string }[] {
  mkdirSync(join(runDir, "refs"));
  return refs.map((source, i) => {
    const frozen = join(runDir, "refs", `ref${i + 1}${extname(source)}`);
    copyFileSync(source, frozen);
    return { source: display(source), frozen: display(frozen), sha256: sha256(readFileSync(frozen)) };
  });
}

type Paid = { runId: string; runDir: string; raw: Buffer; calls: number; refs: ReturnType<typeof freezeRefs> };

async function finishRun(spec: HeroSpec, paid: Paid): Promise<void> {
  const final = await toFinal(spec, paid.raw);
  writeFileSync(join(paid.runDir, `hero-${spec.slug}.png`), final);
  const manifest = {
    runId: paid.runId,
    createdAt: new Date().toISOString(),
    model: getImageModel(),
    entries: [{ slug: spec.slug, apiCalls: paid.calls, sha256: sha256(final), refs: paid.refs, prompt: spec.prompt }],
  };
  writeFileSync(join(paid.runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const contact = await writeContactSheet(paid.runDir, spec, final);
  console.log(`✓ 暫存：${display(paid.runDir)}`);
  const cmd = `npm run generate:games-hub-hero -- --approve --run ${paid.runId} --only ${spec.slug}`;
  console.log(`  審稿：${display(contact)}（左舊、中新${spec.slug === "mobile" ? "、右＝手機實際露出" : ""}）。核可後：${cmd}`);
}

async function runGenerate(spec: HeroSpec): Promise<void> {
  requireApiKey();
  const sources = [...spec.refs(), join(HUB_DIR, `hero-${spec.slug}.webp`)];
  const missing = sources.filter((p) => !existsSync(p));
  if (missing.length > 0) throw new Error(`參考圖或舊海報不在：${missing.map(display).join("、")}`);
  const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomBytes(3).toString("hex")}`;
  const runDir = join(STAGING_ROOT, runId);
  mkdirSync(STAGING_ROOT, { recursive: true });
  mkdirSync(runDir); // 已存在就丟錯：不跟別的 run 共用目錄
  const refs = freezeRefs(runDir, spec.refs());
  console.log(`→ hero-${spec.slug} images.edit ${spec.apiSize}（${getImageModel()}），1 張…`);
  const { raw, calls } = await generateOnce(spec, refs.map((r) => join(ROOT, r.frozen)));
  // 付費結果先落盤，後面任何一步失敗都不用重抽
  writeFileSync(join(runDir, `hero-${spec.slug}.raw.png`), raw);
  try {
    await finishRun(spec, { runId, runDir, raw, calls, refs });
  } catch (error) {
    console.error(`付費的圖已存在 ${display(runDir)}/hero-${spec.slug}.raw.png。不要重跑生圖，先修好後處理。`);
    throw error;
  }
}

/** 驗 run-id、manifest 結構、hash 與尺寸，回傳審過的 staging PNG 路徑。 */
async function verifiedStaged(runId: string, spec: HeroSpec): Promise<string> {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(runId)) throw new Error(`run-id 格式無效：${runId}`);
  const runDir = join(STAGING_ROOT, runId);
  const manifestPath = join(runDir, "manifest.json");
  if (!existsSync(manifestPath)) throw new Error(`${runId} 沒有 manifest.json（生圖中途失敗的 run 不能核可）`);
  const manifest: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  const m = manifest as { runId?: unknown; entries?: unknown };
  if (m.runId !== runId || !Array.isArray(m.entries)) throw new Error(`${runId} 的 manifest 格式不對`);
  const entry = (m.entries as { slug?: unknown; sha256?: unknown }[]).find((e) => e?.slug === spec.slug);
  if (!entry || typeof entry.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(entry.sha256)) {
    throw new Error(`${runId} 的 manifest 沒有 hero-${spec.slug}，或 sha256 格式不對`);
  }
  const staged = join(runDir, `hero-${spec.slug}.png`);
  if (!existsSync(staged) || sha256(readFileSync(staged)) !== entry.sha256) {
    throw new Error(`${runId} 的 hero-${spec.slug} 跟 manifest 對不上`);
  }
  const { width, height } = await sharp(staged).metadata();
  if (width !== spec.out.width || height !== spec.out.height) {
    throw new Error(`${runId} 的 hero-${spec.slug} 是 ${width}×${height}，應為 ${spec.out.width}×${spec.out.height}`);
  }
  return staged;
}

/** 新檔逐一換上；任何一步失敗就把已換的改回舊檔（webp＋avif 不會只換一個）。 */
function swapIn(pairs: readonly { temp: string; target: string }[], tag: string): void {
  const backups = pairs.map((p) => `${p.target}.bak-${tag}`);
  try {
    for (const [i, p] of pairs.entries()) {
      if (existsSync(p.target)) renameSync(p.target, backups[i]!);
      renameSync(p.temp, p.target);
    }
  } catch (error) {
    for (const [i, p] of pairs.entries()) if (existsSync(backups[i]!)) renameSync(backups[i]!, p.target);
    for (const p of pairs) rmSync(p.temp, { force: true });
    throw error;
  }
  for (const b of backups) rmSync(b, { force: true });
}

async function runApprove(runId: string, spec: HeroSpec): Promise<void> {
  const staged = await verifiedStaged(runId, spec);
  const tag = `${process.pid}-${Date.now()}`;
  const targets = [
    { path: join(HUB_DIR, `hero-${spec.slug}.webp`), encode: (s: sharp.Sharp) => s.webp({ quality: 85 }) },
    { path: join(HUB_DIR, `hero-${spec.slug}.avif`), encode: (s: sharp.Sharp) => s.avif({ quality: 55, effort: 6 }) },
  ];
  const pairs = targets.map((t) => ({ temp: `${t.path}.approve-${tag}`, target: t.path }));
  try {
    for (const [i, t] of targets.entries()) await t.encode(sharp(staged)).toFile(pairs[i]!.temp);
  } catch (error) {
    for (const p of pairs) rmSync(p.temp, { force: true });
    throw error;
  }
  swapIn(pairs, tag);
  for (const t of targets) console.log(`✓ ${display(t.path)}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const spec = SPECS[args.only];
  if (args.approve) {
    if (!args.run) throw new Error("--approve 要加 --run <審過的 run-id>");
    return runApprove(args.run, spec);
  }
  if (args.dryRun) {
    console.log(`## hero-${spec.slug} ${spec.apiSize} → ${spec.out.width}×${spec.out.height}（${getImageModel()}）`);
    console.log(`參考圖：${spec.refs().map(display).join("、")}\n${spec.prompt}\n\n共 1 次 API 呼叫（只有逾時才同一張再試 1 次，最多 2 次）。--dry-run 不呼叫。`);
    return;
  }
  await runGenerate(spec);
}

// 成功也明確結束：連線若沒關，行程停著會讓人以為卡住而重跑（再付一次）
main().then(
  () => process.exit(0),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    if (error instanceof Error && error.cause) console.error("cause:", error.cause);
    process.exit(1);
  },
);
