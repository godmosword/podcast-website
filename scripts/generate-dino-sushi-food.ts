#!/usr/bin/env tsx
/**
 * 多多壽司屋重畫的圖（計畫 docs/plans/2026-11-08-dino-sushi-real-shop.md，PR-B）。規格在 scripts/lib/dino-sushi-art-specs.ts。
 *
 *   npm run generate:dino-sushi-food -- --dry-run --round 2            # 只印 prompt、參考圖與路徑
 *   npm run generate:dino-sushi-food -- --only tuna --redo              # 已上線的要重生：點名＋--redo（付費，先確認）
 *   npm run generate:dino-sushi-food -- --round 2 [--only ikura,unagi]  # 每個 slug 1 次 API，暫存到 staging
 *   npm run generate:dino-sushi-food -- --approve --run <run-id> --round 2 [--only ikura]  # 審過 contact sheet 才寫進正式位置
 *
 * 生圖一定要給 --round 或 --only，不會預設全部重生。
 * 食材寫到 public/games/v2/dino-sushi/food/；朋友的「好吃」臉寫到草稿目錄（<id>-yum.jpg），
 * 再由 scripts/build-dino-sushi-customer-stickers.ts 去背成 customers/<id>-yum.webp。
 *
 * 紅線：付費生圖。每次執行每個 slug 最多 1 次呼叫、不自動重抽（逾時同張最多再試 1 次）；
 * 重抽要先在聊天列 slug 與張數、等文字確認。未經人工審稿不得上線；CI 不放 OPENAI_API_KEY。
 * 模型固定 gpt-image-1.5：gpt-image-2 不支援透明底，現有食材也是 1.5 生的，質感才接得上。
 * 手捲的前片（蓋在料上的那片海苔）在核可後從同一張圖切（scripts/cut-dino-sushi-front.ts），不另外生圖。
 */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import sharp from "sharp";
import { ART_SPECS, type ArtSpec } from "./lib/dino-sushi-art-specs";
import { ROOT } from "./lib/transcribe-core";

const STAGING_ROOT = join(ROOT, "public/.games-staging/dino-sushi-food");
const MODEL = "gpt-image-1.5";
const WEBP = { quality: 90, alphaQuality: 100 } as const;

type Args = {
  dryRun: boolean;
  approve: boolean;
  redo: boolean;
  run: string | null;
  only: Set<string> | null;
  round: 1 | 2 | null;
};

const FLAGS = new Set(["--dry-run", "--approve", "--redo"]);
const VALUE_FLAGS = new Set(["--run", "--only", "--round"]);

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
  const round = seen.get("--round");
  if (round !== undefined && round !== "1" && round !== "2") throw new Error(`--round 只能是 1 或 2：${String(round)}`);
  return {
    round: round === undefined ? null : (Number(round) as 1 | 2),
    dryRun: seen.has("--dry-run"),
    approve: seen.has("--approve"),
    redo: seen.has("--redo"),
    run: typeof run === "string" ? run : null,
    only: slugs ? new Set(slugs) : null,
  };
}

function selectSpecs({ only, round }: Pick<Args, "only" | "round">): ArtSpec[] {
  if (!only && round === null) throw new Error("要指定 --round 或 --only，不會預設全部重生");
  const pool = ART_SPECS.filter((s) => round === null || s.round === round);
  if (!only) return [...pool];
  const unknown = [...only].filter((slug) => !pool.some((s) => s.slug === slug));
  if (unknown.length > 0) throw new Error(`不認得的 slug（或不在這一輪）：${unknown.join("、")}`);
  return pool.filter((s) => only.has(s.slug));
}

/** 付費生圖只做還沒定案的；已上線或使用者說不要的，要 --only 點名加 --redo 才重生。 */
function specsToGenerate(args: Args): ArtSpec[] {
  const picked = selectSpecs(args);
  const settled = picked.filter((s) => s.status !== "pending");
  if (settled.length === 0) return picked;
  if (args.redo && args.only) return picked;
  const names = settled.map((s) => `${s.slug}（${s.status === "shipped" ? "已上線" : "使用者說不要"}）`).join("、");
  if (args.only) throw new Error(`這些已經定案，要重生請加 --redo：${names}`);
  const pending = picked.filter((s) => s.status === "pending");
  if (pending.length === 0) throw new Error(`這一輪都已定案，沒有要生的：${names}`);
  console.log(`略過已定案的：${names}`);
  return pending;
}
const sha256 = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");
const display = (p: string): string => relative(ROOT, p) || ".";

function requireApiKey(): void {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key || key === "sk-..." || key.endsWith("...")) {
    throw new Error("缺有效的 OPENAI_API_KEY（.env.local）；本 script 僅限本機執行。");
  }
}

async function callImageApi(spec: ArtSpec): Promise<Buffer> {
  const { default: OpenAI, toFile } = await import("openai");
  // SDK 預設會自己重試；關掉，重試次數只由 generateOnce 決定（同張最多 2 次）
  const client = new OpenAI({ maxRetries: 0 });
  const files = await Promise.all(
    spec.refs.map(async (path, i) => toFile(await sharp(path).png().toBuffer(), `ref${i}.png`, { type: "image/png" })),
  );
  const face = spec.kind === "face";
  const response = await client.images.edit({
    model: MODEL,
    image: files,
    prompt: spec.prompt,
    size: spec.size,
    quality: "high",
    // 食材要透明底；朋友的臉照草稿的白底，之後走既有去背流程（輪底、翻轉都在那裡）
    background: face ? "opaque" : "transparent",
    // 朋友的臉只改眼睛和嘴，車身要照參考圖
    ...(face ? { input_fidelity: "high" as const } : {}),
    output_format: "png",
  });
  const base64 = response.data?.[0]?.b64_json;
  if (!base64) throw new Error(`${spec.slug}：圖像模型未回傳影像`);
  return Buffer.from(base64, "base64");
}

/** 逾時或連線中斷才再試一次（同一張、同一個 prompt）；其他錯誤直接停。 */
async function generateOnce(spec: ArtSpec): Promise<{ raw: Buffer; calls: number }> {
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

/** 食材：去透明邊轉 webp。朋友的臉：原樣 PNG（白底，交給去背流程）。 */
async function toStaged(spec: ArtSpec, raw: Buffer): Promise<{ file: string; data: Buffer }> {
  if (spec.kind === "face") return { file: `${spec.slug}.png`, data: raw };
  return { file: `${spec.slug}.webp`, data: await sharp(raw).trim({ threshold: 1 }).webp(WEBP).toBuffer() };
}

const stagedName = (spec: ArtSpec): string => (spec.kind === "face" ? `${spec.slug}.png` : `${spec.slug}.webp`);

/** 每列：舊圖｜新圖，放在奶油底上，跟遊戲裡看起來一樣。 */
async function writeContactSheet(runDir: string, specs: readonly ArtSpec[]): Promise<string> {
  const cell = 360;
  const bg = { r: 251, g: 241, b: 225, alpha: 1 };
  const tile = (input: string | Buffer) =>
    sharp(input).resize(cell - 24, cell - 24, { fit: "contain", background: bg }).flatten({ background: bg }).png().toBuffer();
  const rows = await Promise.all(
    specs.map(async (spec) => [await tile(spec.compare), await tile(join(runDir, stagedName(spec)))]),
  );
  const composites = rows.flatMap((pair, r) => pair.map((input, c) => ({ input, left: c * cell + 12, top: r * cell + 12 })));
  const out = join(runDir, "contact-sheet.jpg");
  await sharp({ create: { width: cell * 2, height: cell * rows.length, channels: 3, background: "#ffffff" } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(out);
  return out;
}

async function runGenerate(specs: readonly ArtSpec[]): Promise<void> {
  requireApiKey();
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(STAGING_ROOT, runId);
  mkdirSync(runDir, { recursive: true });
  const entries: Record<string, unknown>[] = [];
  const done: ArtSpec[] = [];
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
      const staged = await toStaged(spec, raw);
      if (spec.kind === "food") writeFileSync(join(runDir, `${spec.slug}.raw.png`), raw);
      writeFileSync(join(runDir, staged.file), staged.data);
      entries.push({ slug: spec.slug, size: spec.size, refs: spec.refs.map(display), apiCalls: calls, sha256: sha256(staged.data), prompt: spec.prompt });
      done.push(spec);
      saveManifest();
    }
  } finally {
    if (done.length > 0) await writeContactSheet(runDir, done);
  }
  const contact = join(runDir, "contact-sheet.jpg");
  console.log(`✓ 暫存：${display(runDir)}`);
  console.log(`  審稿：${display(contact)}（左舊／參考，右新）。核可後：npm run generate:dino-sushi-food -- --approve --run ${runId} --only <slug,...>`);
}

type Manifest = { runId: string; model: string; entries: { slug: string; sha256: string }[] };

/** 先把要核可的每一張都驗過（run、模型、hash），全部通過才開始覆蓋，不會只換一半。 */
function verifiedStaged(runId: string, specs: readonly ArtSpec[]): string[] {
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(runId)) throw new Error(`run-id 格式無效：${runId}`);
  const runDir = join(STAGING_ROOT, runId);
  const manifest = JSON.parse(readFileSync(join(runDir, "manifest.json"), "utf8")) as Manifest;
  if (manifest.runId !== runId || manifest.model !== MODEL) throw new Error(`${runId} 的 manifest 對不上（run 或模型）`);
  return specs.map((spec) => {
    const entry = manifest.entries.find((e) => e.slug === spec.slug);
    if (!entry || !/^[0-9a-f]{64}$/.test(entry.sha256)) throw new Error(`${runId} 沒有 ${spec.slug} 的生成紀錄`);
    const staged = join(runDir, stagedName(spec));
    if (!existsSync(staged) || sha256(readFileSync(staged)) !== entry.sha256) throw new Error(`${spec.slug} 暫存檔與 manifest 不符`);
    return staged;
  });
}

/**
 * 先把每一張寫成旁邊的暫存檔，全部成功才一起改名蓋上去；中途失敗就刪掉暫存檔，正式檔一張都不動。
 * 朋友的臉跟原本的草稿一樣存成白底 JPG（PNG 一張 1MB 多，JPG 約 200KB）。
 */
async function runApprove(runId: string, specs: readonly ArtSpec[]): Promise<void> {
  const staged = verifiedStaged(runId, specs);
  const temps = specs.map((spec) => `${spec.target}.approve-${runId}`);
  try {
    for (const [i, spec] of specs.entries()) {
      if (spec.kind === "face") await sharp(staged[i]!).flatten({ background: "#ffffff" }).jpeg({ quality: 92 }).toFile(temps[i]!);
      else copyFileSync(staged[i]!, temps[i]!);
    }
  } catch (error) {
    for (const temp of temps) rmSync(temp, { force: true });
    throw error;
  }
  for (const [i, spec] of specs.entries()) {
    renameSync(temps[i]!, spec.target);
    console.log(`✓ ${spec.slug} → ${display(spec.target)}（sha256 ${sha256(readFileSync(spec.target)).slice(0, 12)}）`);
  }
  console.log("接著：朋友的臉跑 build-dino-sushi-customer-stickers、食材視需要切前片；npm run optimize:dino-sushi-assets、更新 SOURCES.md。");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const specs = selectSpecs(args);
  if (args.approve) {
    // 一定要指定審過的那次 run，不猜「最新的一次」
    if (!args.run) throw new Error("--approve 要加 --run <審過的 run-id>");
    return await runApprove(args.run, specs);
  }
  if (args.dryRun) {
    // 跟真的生圖用同一套挑法，dry-run 印出來的張數就是會付費的張數
    const toGenerate = specsToGenerate(args);
    for (const spec of toGenerate) {
      console.log(`\n## ${spec.slug}（${spec.label}）${spec.size}，參考圖：${spec.refs.map(display).join("、")} → ${display(spec.target)}\n${spec.prompt}`);
    }
    console.log(`\n共 ${toGenerate.length} 次 API 呼叫（${MODEL}）。--dry-run 不呼叫。`);
    return;
  }
  await runGenerate(specsToGenerate(args));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
