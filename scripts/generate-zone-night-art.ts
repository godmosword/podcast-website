#!/usr/bin/env tsx
/**
 * 五島夜間點燈版整島 PNG（D4 / Art Bible §12.5、§12.6）。
 *
 *   npm run generate:zone-night -- --dry-run              # 只印計畫與成本估算，不呼叫 API
 *   npm run generate:zone-night -- --only dino,forest     # 指定島
 *   npm run generate:zone-night                           # 生圖到 staging + contact sheet
 *   npm run generate:zone-night -- --approve              # 審圖通過後覆蓋到 public
 *
 * 為什麼用 images.edit 而不是 text-to-image：
 * 夜圖與日圖會在 `ZoneIslandTileArt` 做 crossfade。若夜圖是重新生成的另一座島，
 * 淡入時island 會「變形」。餵日圖當 image reference 才能得到「同一座島、只是入夜點燈」。
 *
 * 產出後須人工審 contact sheet，再 `--approve`，最後把該島的 `hasNightArt` 翻 true
 * （lib/universe/zone-art-tile.ts）。翻 true 後 `ZoneNightLights` 的 CSS 點燈會自動退場。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { CLAY_NEGATIVE, CLAY_STYLE_PREFIX, getImageModel } from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const ZONE_DIR = join(ROOT, "public/adventures/zones");
const STAGING_DIR = join(ROOT, "public/.zone-night-staging");

/** 與 lib/universe/zone-art-tile.ts 的 stageSize 對齊（hero 島放大一級）。 */
const ISLAND_STAGE = { w: 264, h: 260 } as const;
const HERO_STAGE = { w: 330, h: 325 } as const;

type ZoneNightSpec = {
  id: string;
  stage: { w: number; h: number };
  /** 該島夜景的具體描述：燈在哪、什麼顏色。愈具體，五島愈像同一個世界入夜。 */
  scene: string;
};

/**
 * 夜間態共同規則（Art Bible §12.5）：
 * 只換「光」，不換「形」——地形、建築、植栽、步道位置一律不動。
 */
const NIGHT_BASE =
  "Convert this exact clay island diorama to a cozy night-time version. " +
  "CRITICAL: keep the identical island silhouette, terrain shape, buildings, props, " +
  "vegetation and their exact positions — change ONLY the lighting. " +
  "Cool moonlit ambient light with deep blue-violet shadows on the clay, " +
  "overall darker and lower saturation than daytime, " +
  "but warm glowing lights switched on across the island. " +
  "Keep the matte clay material, soft rounded edges, no gloss, no harsh contrast. " +
  "Cozy bedtime storybook mood, gentle and not scary. " +
  "Solid flat magenta (#FF00FF) background for chroma-key, single island centered.";

const SPECS: readonly ZoneNightSpec[] = [
  {
    id: "car-park",
    stage: HERO_STAGE,
    scene:
      "Warm amber lights on the ferris wheel rim and hub, glowing festoon string lights " +
      "along the walkway, small lit lamps beside the parked cars, soft light on the pond.",
  },
  {
    id: "dino",
    stage: ISLAND_STAGE,
    scene:
      "Soft orange embers glowing at the volcano crater, a small warm campfire light " +
      "near the path, faint warm lanterns among the palm trees.",
  },
  {
    id: "rescue",
    stage: ISLAND_STAGE,
    scene:
      "Lit windows glowing warm yellow in the fire station building, a soft amber beacon " +
      "on the tower, headlights of the fire truck and rescue car gently on.",
  },
  {
    id: "ocean",
    stage: ISLAND_STAGE,
    scene:
      "Cool cyan-white futuristic light strips glowing on the rocket and pods, " +
      "soft teal underlighting on the water feature, pale lilac lamps along the path.",
  },
  {
    id: "forest",
    stage: ISLAND_STAGE,
    scene:
      "Warm honey-colored light glowing from the treehouse windows, tiny lantern lights " +
      "along the wooden ladder, soft firefly-like glows among the leaves.",
  },
];

function promptFor(spec: ZoneNightSpec): string {
  return `${CLAY_STYLE_PREFIX}${NIGHT_BASE} ${spec.scene} ${CLAY_NEGATIVE}`;
}

function requireKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("需要 OPENAI_API_KEY（.env.local）");
  }
}

/** 日圖去背後底下墊洋紅，讓模型看得到完整島形，回傳的背景也才好 chroma-key。 */
async function dayRefOnMagenta(id: string): Promise<Buffer> {
  const src = join(ZONE_DIR, `${id}@3x.png`);
  const fallback = join(ZONE_DIR, `${id}.png`);
  const path = existsSync(src) ? src : fallback;
  if (!existsSync(path)) throw new Error(`缺少日圖 ${path}`);
  return sharp(path)
    .flatten({ background: { r: 255, g: 0, b: 255 } })
    .png()
    .toBuffer();
}

async function generateNight(id: string, spec: ZoneNightSpec): Promise<Buffer> {
  requireKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const ref = await toFile(await dayRefOnMagenta(id), `${id}.png`, {
    type: "image/png",
  });
  const res = await client.images.edit({
    model: getImageModel(),
    image: [ref],
    prompt: promptFor(spec),
    size: "1024x1024",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error(`圖像模型未回傳 ${id} 夜圖`);
  return Buffer.from(b64, "base64");
}

/** 洋紅 chroma-key 去背（與 generate-forest-zone-art.ts 同閾值，跨管線一致）。 */
async function chromaKey(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i]! > 200 && out[i + 1]! < 80 && out[i + 2]! > 200) out[i + 3] = 0;
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

/**
 * 日／夜剪影重疊率（IoU）。crossfade 的前提是兩張圖是同一座島；
 * 剪影漂掉的話淡入會看起來像島在變形，必須讓審圖的人看到這個數字。
 */
async function silhouetteIoU(nightPng: Buffer, id: string, stage: { w: number; h: number }): Promise<number> {
  const norm = (buf: Buffer | string) =>
    sharp(buf)
      .resize(stage.w, stage.h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extractChannel(3)
      .raw()
      .toBuffer();
  const [a, b] = await Promise.all([
    norm(join(ZONE_DIR, `${id}.png`)),
    norm(nightPng),
  ]);
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.length; i += 1) {
    const pa = a[i]! > 32;
    const pb = b[i]! > 32;
    if (pa && pb) inter += 1;
    if (pa || pb) union += 1;
  }
  return union === 0 ? 0 : inter / union;
}

async function fitStage(input: Buffer, w: number, h: number): Promise<Buffer> {
  return sharp(input)
    .resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** 日｜夜並排 contact sheet，供人工審「是不是同一座島、只是點了燈」。 */
async function writeContactSheet(ids: readonly string[]): Promise<void> {
  const cell = 260;
  const rows = await Promise.all(
    ids.map(async (id) => {
      const day = await sharp(join(ZONE_DIR, `${id}.png`))
        .resize(cell, cell, { fit: "contain", background: { r: 220, g: 235, b: 245, alpha: 1 } })
        .toBuffer();
      const night = await sharp(join(STAGING_DIR, `${id}.night.png`))
        .resize(cell, cell, { fit: "contain", background: { r: 30, g: 45, b: 75, alpha: 1 } })
        .toBuffer();
      return sharp({
        create: { width: cell * 2, height: cell, channels: 3, background: { r: 0, g: 0, b: 0 } },
      })
        .composite([
          { input: day, left: 0, top: 0 },
          { input: night, left: cell, top: 0 },
        ])
        .png()
        .toBuffer();
    }),
  );
  const sheet = sharp({
    create: {
      width: cell * 2,
      height: cell * rows.length,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  }).composite(rows.map((input, i) => ({ input, left: 0, top: i * cell })));
  const out = join(STAGING_DIR, "contact-sheet.jpg");
  writeFileSync(out, await sheet.jpeg({ quality: 88 }).toBuffer());
  console.log(`\n審圖: ${out.replace(ROOT + "/", "")}（左＝日圖、右＝夜圖）`);
}

function selectSpecs(only: string[] | null): readonly ZoneNightSpec[] {
  if (!only) return SPECS;
  const ids = new Set(only);
  const picked = SPECS.filter((s) => ids.has(s.id));
  const unknown = only.filter((id) => !SPECS.some((s) => s.id === id));
  if (unknown.length > 0) {
    throw new Error(`未知 zone id：${unknown.join(", ")}。可選：${SPECS.map((s) => s.id).join(", ")}`);
  }
  return picked;
}

function parseOnly(args: string[]): string[] | null {
  const i = args.indexOf("--only");
  if (i === -1) return null;
  const v = args[i + 1];
  if (!v || v.startsWith("--")) throw new Error("--only 需接 zone id，例如 --only dino,forest");
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function runDryRun(specs: readonly ZoneNightSpec[]): void {
  console.log(`【dry-run】不呼叫 API。將對 ${specs.length} 座島各生 1 張 1024×1024 夜圖：\n`);
  for (const spec of specs) {
    console.log(`  ${spec.id}  (stage ${spec.stage.w}×${spec.stage.h})`);
    console.log(`    ref: zones/${spec.id}@3x.png → images.edit`);
    console.log(`    out: .zone-night-staging/${spec.id}.night.png`);
  }
  console.log(`\n模型：${getImageModel()}　影像呼叫次數：${specs.length}（不含重試）`);
  console.log("approve 後每島另產 1x/@2x/@3x PNG + webp 共 6 檔。");
  console.log(`\nprompt 範例（${specs[0]?.id}）：\n${promptFor(specs[0]!).slice(0, 320)}…`);
}

async function runGenerate(specs: readonly ZoneNightSpec[]): Promise<void> {
  mkdirSync(STAGING_DIR, { recursive: true });
  for (const spec of specs) {
    console.log(`生圖 ${spec.id} 夜圖（reference: 日圖）…`);
    const keyed = await chromaKey(await generateNight(spec.id, spec));
    const iou = await silhouetteIoU(keyed, spec.id, spec.stage);
    writeFileSync(join(STAGING_DIR, `${spec.id}.night.png`), keyed);
    const flag = iou < 0.9 ? "⚠ 剪影漂移，crossfade 會看起來像島在變形" : "✓";
    console.log(`  ${flag} 日夜剪影 IoU ${(iou * 100).toFixed(1)}%`);
  }
  await writeContactSheet(specs.map((s) => s.id));
  console.log("\n通過後：npm run generate:zone-night -- --approve");
}

async function writeWebp(pngPath: string): Promise<void> {
  await sharp(pngPath).webp({ quality: 82 }).toFile(pngPath.replace(/\.png$/, ".webp"));
}

async function runApprove(specs: readonly ZoneNightSpec[]): Promise<void> {
  if (!existsSync(STAGING_DIR) || readdirSync(STAGING_DIR).length === 0) {
    throw new Error("找不到 staging 內容。請先執行 npm run generate:zone-night。");
  }
  for (const spec of specs) {
    const staged = join(STAGING_DIR, `${spec.id}.night.png`);
    if (!existsSync(staged)) {
      console.log(`  跳過 ${spec.id}（staging 無此島）`);
      continue;
    }
    const master = readFileSync(staged);
    for (const d of [1, 2, 3] as const) {
      const name = d === 1 ? `${spec.id}.night.png` : `${spec.id}.night@${d}x.png`;
      const out = join(ZONE_DIR, name);
      writeFileSync(out, await fitStage(master, spec.stage.w * d, spec.stage.h * d));
      await writeWebp(out);
      console.log(`  → ${out.replace(ROOT + "/", "")}`);
    }
  }
  console.log(
    "\n✓ 夜圖已落地。最後一步：把該島的 hasNightArt 翻 true" +
      "（lib/universe/zone-art-tile.ts）——翻了才會顯示，且該島 CSS 點燈會自動退場。",
  );
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const specs = selectSpecs(parseOnly(args));
  if (args.includes("--dry-run")) return runDryRun(specs);
  if (args.includes("--approve")) return runApprove(specs);
  await runGenerate(specs);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
