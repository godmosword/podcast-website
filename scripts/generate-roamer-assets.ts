#!/usr/bin/env tsx
/**
 * 樂園地圖漫遊者黏土小車 PNG（gpt-image-2 + 定裝照 edit → sharp 後製）。
 *
 * 用法：
 *   npm run generate:roamer-assets -- --dry-run
 *   npm run generate:roamer-assets
 *   npm run generate:roamer-assets -- --only xiao-hong
 *   npm run generate:roamer-assets -- --verify
 *   npm run generate:roamer-assets -- --approve
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import {
  characterRefFsPath,
  getImageModel,
  readCharacters,
} from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const STAGING = join(ROOT, "public/.roamer-staging");
const OUT_DIR = join(ROOT, "public/adventures/roamers");
const TARGET_LONG_PX = 700;
const BOTTOM_PAD_RATIO = 0.04;
const CHROMA = { r: 255, g: 0, b: 255 };
const CHROMA_THRESHOLD = 48;

const REF_PREFIX =
  "Match the character's face, colors, and clay style from the reference portrait exactly. " +
  "Repose into a map-roamer asset only — do not change identity. ";

type RoamerSpec = {
  id: string;
  characterName: string;
  positive: string;
  negative: string;
};

const ROAMER_SPECS: RoamerSpec[] = [
  {
    id: "xiao-hong",
    characterName: "小紅賽車",
    positive:
      "A cute super-deformed chibi clay toy race car, short chunky stubby proportions, a " +
      "rounded chubby body, small chunky wheels with all four wheels clearly visible and " +
      "separable. The car is a bright red race car with the number 2 inside a white circle " +
      "on the side, a white racing stripe down the middle, blue and yellow accents, and a " +
      "friendly face with two big round eyes and a cheerful smile on the front. Shown in a " +
      "three-quarter side view facing screen-left in a gentle driving pose, upright and level " +
      "on flat ground, viewed from a slight high angle about 30 degrees to match a tabletop " +
      "diorama. Handmade matte polymer clay, soft rounded pressed edges, subtle thumbprint " +
      "texture, no gloss. Soft even diffuse lighting, low contrast, short soft contact shadow. " +
      "Pastel storybook palette, bright and friendly for kids. Stop-motion / claymation " +
      "aesthetic. Isolated on a transparent background, single object, centered.",
    negative:
      "tilted, leaning, motion blur, perspective distortion, flat orthographic side profile, " +
      "top-down, glossy, plastic shine, hard directional shadow, long cast shadow, " +
      "photorealistic, extra text, words, watermark, neon, oversaturated, sharp hard edges, " +
      "Pixar Cars, Lightning McQueen, branded character, copyrighted character, multiple cars, cluttered",
  },
  {
    id: "duo-duo",
    characterName: "恐龍車多多",
    positive:
      "A cute super-deformed chibi clay toy car, short chunky stubby proportions, a rounded " +
      "chubby body, small chunky wheels with all four wheels clearly visible and separable. " +
      "The car is a small green dinosaur car: a chubby green car body with a friendly cartoon " +
      "T-rex head at the front, orange spikes running along its back, big round cartoon eyes, " +
      "and a wide happy mouth showing rows of teeth. It has four black wheels only — no arms, " +
      "no hands, no legs, no limbs. Shown in a three-quarter side view facing screen-left in a " +
      "gentle driving pose, upright and level on flat ground, viewed from a slight high angle " +
      "about 30 degrees to match a tabletop diorama. Handmade matte polymer clay, soft rounded " +
      "pressed edges, subtle thumbprint texture, no gloss. Soft even diffuse lighting, low " +
      "contrast, short soft contact shadow. Pastel storybook palette, bright and friendly for " +
      "kids. Stop-motion / claymation aesthetic. Isolated on a transparent background, single " +
      "object, centered.",
    negative:
      "arms, hands, legs, limbs, standing dinosaur, walking pose, tilted, leaning, motion blur, " +
      "perspective distortion, flat orthographic side, top-down, glossy, plastic shine, hard " +
      "directional shadow, long cast shadow, photorealistic, text, letters, numbers, watermark, " +
      "neon, oversaturated, sharp hard edges, branded character, copyrighted character, " +
      "multiple cars, cluttered",
  },
];

function usage(): never {
  console.log(`用法:
  generate-roamer-assets.ts [--dry-run] [--only xiao-hong,duo-duo]
  generate-roamer-assets.ts [--verify] [--approve]

環境: .env.local 的 OPENAI_API_KEY
流程: 生圖 → 審 staging contact sheet → --approve`);
  process.exit(1);
}

function requireApiKey(): void {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "缺 OPENAI_API_KEY。請在 .env.local 設定（可複製 .env.example），與 npm run illustrate 相同。",
    );
  }
  if (key === "sk-..." || key.endsWith("...")) {
    throw new Error(
      "OPENAI_API_KEY 仍是 .env.example 占位符。請改成 platform.openai.com 的有效 key。",
    );
  }
}

function buildPrompt(spec: RoamerSpec, magentaBg: boolean): string {
  const bg = magentaBg
    ? "Solid flat magenta #FF00FF background only. "
    : "";
  return `${REF_PREFIX}${bg}${spec.positive} Avoid: ${spec.negative}`;
}

function resolveRef(characterName: string): string {
  const roster = readCharacters();
  const char = roster.find((c) => c.name === characterName);
  if (!char) throw new Error(`名冊找不到「${characterName}」`);
  const refPath = char.ref
    ? join(ROOT, "public", char.ref)
    : characterRefFsPath(characterName);
  if (!existsSync(refPath)) {
    throw new Error(`缺定裝照 ${refPath}`);
  }
  return refPath;
}

async function hasCleanAlpha(buf: Buffer): Promise<boolean> {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const corners: [number, number][] = [
    [0, 0],
    [w - 1, 0],
    [0, h - 1],
    [w - 1, h - 1],
  ];
  let transparent = 0;
  for (const [x, y] of corners) {
    const a = data[(y * w + x) * 4 + 3];
    if (a < 32) transparent++;
  }
  return transparent >= 3;
}

async function chromaKeyToAlpha(buf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const dr = r - CHROMA.r;
    const dg = g - CHROMA.g;
    const db = b - CHROMA.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < CHROMA_THRESHOLD) {
      data[i + 3] = 0;
    } else if (dist < CHROMA_THRESHOLD * 1.8) {
      const t = (dist - CHROMA_THRESHOLD) / (CHROMA_THRESHOLD * 0.8);
      data[i + 3] = Math.min(data[i + 3]!, Math.round(255 * t));
      data[i] = Math.min(r, Math.max(g, b));
      data[i + 2] = Math.min(b, Math.max(g, r));
    }
  }
  return sharp(data, { raw: { width, height, channels: 4 } }).png().toBuffer();
}

type OpaqueBounds = {
  minX: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

async function measureOpaqueBounds(buf: Buffer): Promise<OpaqueBounds> {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const a = data[(y * info.width + x) * 4 + 3]!;
      if (a > 32) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < minX) {
    throw new Error("後製失敗：找不到不透明像素");
  }
  return {
    minX,
    maxX,
    maxY,
    width: info.width,
    height: info.height,
  };
}

async function postProcessRoamer(buf: Buffer): Promise<Buffer> {
  let working = buf;
  if (!(await hasCleanAlpha(working))) {
    working = await chromaKeyToAlpha(working);
  }

  const trimmed = await sharp(working).trim({ threshold: 10 }).png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const scale = TARGET_LONG_PX / Math.max(w, h);
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const resized = await sharp(trimmed)
    .resize(nw, nh, { fit: "inside" })
    .png()
    .toBuffer();

  const bounds = await measureOpaqueBounds(resized);
  const objCenterX = (bounds.minX + bounds.maxX) / 2;
  const objBottom = bounds.maxY;
  const bottomPad = Math.max(8, Math.round(nh * BOTTOM_PAD_RATIO));
  const canvasW = Math.max(nw, Math.round(nw * 1.04));
  const canvasH = nh + bottomPad;
  const left = Math.round(canvasW / 2 - objCenterX);
  const top = Math.round(canvasH - bottomPad - objBottom);

  const out = await sharp({
    create: {
      width: canvasW,
      height: canvasH,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();

  const finalMeta = await sharp(out).metadata();
  if (!finalMeta.hasAlpha) {
    throw new Error("後製失敗：輸出 PNG 無 alpha 通道");
  }
  return out;
}

async function callImageEdit(refPath: string, prompt: string): Promise<Buffer> {
  requireApiKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const file = await toFile(readFileSync(refPath), "ref.jpg", {
    type: "image/jpeg",
  });
  try {
    const res = await client.images.edit({
      model: getImageModel(),
      image: file,
      prompt,
      size: "1024x1024",
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("圖像模型未回傳影像");
    return Buffer.from(b64, "base64");
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401") || /Incorrect API key/i.test(msg)) {
      throw new Error(
        "OpenAI 401：API key 無效或已撤銷。請更新 .env.local 的 OPENAI_API_KEY。",
      );
    }
    throw err;
  }
}

async function generateOne(spec: RoamerSpec): Promise<Buffer> {
  const refPath = resolveRef(spec.characterName);
  console.log(`  定裝照 ${refPath.replace(ROOT + "/", "")}`);

  // gpt-image-2 edit 不支援 transparent background → magenta 平背 + chroma-key
  const raw = await callImageEdit(refPath, buildPrompt(spec, true));
  const keyed = await chromaKeyToAlpha(raw);
  return postProcessRoamer(keyed);
}

async function writeContactSheet(): Promise<string> {
  const files = ROAMER_SPECS.map((s) => `${s.id}.png`).filter((f) =>
    existsSync(join(STAGING, f)),
  );
  if (files.length === 0) throw new Error("staging 無 PNG 可審");

  const tile = 340;
  const cols = Math.min(2, files.length);
  const rows = Math.ceil(files.length / cols);
  const checker = await sharp({
    create: {
      width: tile,
      height: tile,
      channels: 3,
      background: "#cccccc",
    },
  })
    .png()
    .toBuffer();

  const composites = await Promise.all(
    files.map(async (file, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const input = await sharp(join(STAGING, file))
        .resize(tile, tile, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      return { input, left: col * tile, top: row * tile, bg: checker };
    }),
  );

  const canvas = sharp({
    create: {
      width: cols * tile,
      height: rows * tile,
      channels: 4,
      background: { r: 204, g: 204, b: 204, alpha: 255 },
    },
  });

  const layers: { input: Buffer; left: number; top: number }[] = [];
  for (const c of composites) {
    layers.push({ input: c.input, left: c.left, top: c.top });
  }

  const out = join(STAGING, "contact-sheet.png");
  await canvas.composite(layers).png().toFile(out);
  return out;
}

async function verifyAssets(dir: string): Promise<void> {
  for (const spec of ROAMER_SPECS) {
    const p = join(dir, `${spec.id}.png`);
    if (!existsSync(p)) {
      console.log(`✗ ${spec.id}: 檔案不存在`);
      continue;
    }
    const meta = await sharp(p).metadata();
    const long = Math.max(meta.width ?? 0, meta.height ?? 0);
    const okAlpha = meta.hasAlpha === true;
    const okSize = long >= 650 && long <= 750;
    console.log(
      `${okAlpha && okSize ? "✓" : "⚠"} ${spec.id}: ${meta.width}×${meta.height}, alpha=${meta.hasAlpha}, long=${long}`,
    );
  }
}

function parseOnlyIds(args: string[]): string[] | null {
  const idx = args.indexOf("--only");
  if (idx === -1) return null;
  const raw = args[idx + 1];
  if (!raw || raw.startsWith("-")) {
    throw new Error("--only 需接 id，例如 --only xiao-hong,duo-duo");
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function runGenerate(onlyIds: string[] | null): Promise<void> {
  mkdirSync(STAGING, { recursive: true });
  const specs = onlyIds
    ? ROAMER_SPECS.filter((s) => onlyIds.includes(s.id))
    : [...ROAMER_SPECS];
  if (specs.length === 0) {
    throw new Error(
      `無效的 --only。可選：${ROAMER_SPECS.map((s) => s.id).join(", ")}`,
    );
  }

  for (const spec of specs) {
    const out = join(STAGING, `${spec.id}.png`);
    console.log(`生圖 ${spec.id}（${spec.characterName}）→ ${out}`);
    const buf = await generateOne(spec);
    writeFileSync(out, buf);
    await verifyAssets(STAGING);
  }

  const sheet = await writeContactSheet();
  console.log(`完成。請審 contact sheet: ${sheet}`);
  console.log("通過後: npm run generate:roamer-assets -- --approve");
}

function runDryRun(onlyIds: string[] | null): void {
  const specs = onlyIds
    ? ROAMER_SPECS.filter((s) => onlyIds.includes(s.id))
    : [...ROAMER_SPECS];
  for (const spec of specs) {
    console.log(`\n## ${spec.id} → ${spec.id}.png`);
    console.log(`角色：${spec.characterName}`);
    try {
      console.log(`定裝照：${resolveRef(spec.characterName).replace(ROOT + "/", "")}`);
    } catch (err) {
      console.log(`⚠ ${(err as Error).message}`);
    }
    console.log(buildPrompt(spec, false));
  }
}

function runApprove(): void {
  if (!existsSync(STAGING)) {
    throw new Error("找不到 staging。請先生圖再 --approve。");
  }
  const missing = ROAMER_SPECS.filter(
    (s) => !existsSync(join(STAGING, `${s.id}.png`)),
  );
  if (missing.length > 0) {
    throw new Error(
      `staging 缺 ${missing.map((s) => s.id).join(", ")}。請先完成生圖。`,
    );
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of ROAMER_SPECS) {
    const src = join(STAGING, `${spec.id}.png`);
    const dest = join(OUT_DIR, `${spec.id}.png`);
    copyFileSync(src, dest);
    console.log(`approve ${dest.replace(ROOT + "/", "")}`);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) usage();
  const onlyIds = parseOnlyIds(args);

  if (args.includes("--dry-run")) {
    runDryRun(onlyIds);
    return;
  }
  if (args.includes("--verify")) {
    const dir = existsSync(STAGING) ? STAGING : OUT_DIR;
    await verifyAssets(dir);
    return;
  }
  if (args.includes("--approve")) {
    runApprove();
    await verifyAssets(OUT_DIR);
    return;
  }
  await runGenerate(onlyIds);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
