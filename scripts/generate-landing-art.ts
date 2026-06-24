#!/usr/bin/env tsx
/**
 * Landing Hub segment hero 生圖（gpt-image-2，獨立於 illustrate 管線）。
 *
 * 用法：
 *   npm run generate:landing-art -- --dry-run
 *   npm run generate:landing-art          # 讀 .env.local 的 OPENAI_API_KEY
 *   npm run generate:landing-art -- --approve
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
  CLAY_NEGATIVE,
  CLAY_STYLE_PREFIX,
  getImageModel,
  readCharacters,
} from "./lib/illustrate-core";

import { ROOT } from "./lib/transcribe-core";
const STAGING = join(ROOT, "public/.landing-staging");
const OUT_DIR = join(ROOT, "public/landing");

/** 避免 AI 在擋風玻璃 + 保險桿各畫一張臉 */
const VEHICLE_FACE_RULE =
  "Each vehicle has exactly ONE face on the FRONT windshield only; side windows are plain tinted glass with NO face; bumpers and grilles have NO eyes or mouth; headlights are small plain lamps that do NOT look like eyes.";

const LANDING_VEHICLE_NEGATIVE =
  "No face on bumper. No face on grille. Headlights must NOT look like eyes. No duplicate facial features anywhere on the vehicle body.";

/**
 * cast = data/characters.json 的 canonical 角色名；其定裝照會當參考圖餵給
 * images.edit，並把該角色 desc 接進 prompt，使 landing 與單集插畫 on-model。
 * scene 只描述「動作 / 構圖 / 氛圍」，不要重述角色外觀（交給定裝照 + desc）。
 */
const LANDING_ART_SPECS = [
  {
    id: "stories",
    file: "segment-stories.jpg",
    cast: ["恐龍車多多", "安安救護車", "東東挖土機", "小紅賽車"],
    scene:
      "The provided vehicle friends playing together in a colorful clay amusement park (ferris wheel, carousel) on a warm sunny day; inviting storybook group scene; leave clean negative space in the upper-left for a title overlay. " +
      VEHICLE_FACE_RULE,
  },
  {
    id: "bedtime",
    file: "segment-bedtime.jpg",
    cast: ["藍色小巴士"],
    scene:
      "Cozy night scene with the provided blue minibus parked calmly on a soft green hill; crescent moon and stars; three sleeping fluffy clay sheep nearby; sleepy, calm, low-light palette; leave clean negative space in the upper area for a title overlay. " +
      VEHICLE_FACE_RULE,
  },
  {
    id: "clay",
    file: "segment-clay.jpg",
    cast: ["恐龍車多多"],
    scene:
      "Child-friendly hands gently shaping the provided clay vehicle on a craft table; rainbow clay blobs and simple sculpting tools around; playful hands-on craft mood; bright studio light; leave clean negative space on one side for a title overlay. " +
      VEHICLE_FACE_RULE,
  },
  {
    id: "health",
    file: "segment-health.jpg",
    cast: ["安安救護車", "亮亮警車"],
    scene:
      "The provided vehicle friends demonstrating healthy daily habits — one brushing teeth, one waiting safely at a crosswalk with a traffic light; warm, gentle educational tone; clay checklist props; leave clean negative space in the upper area for a title overlay. " +
      VEHICLE_FACE_RULE,
  },
] as const;

const BANNER_SUFFIX =
  "Wide 16:9 hero banner composition for a children's website section header. No text, no logos, no watermark.";

function usage(): never {
  console.log(`用法:
  generate-landing-art.ts [--dry-run]
  generate-landing-art.ts [--only stories,health,bedtime]
  generate-landing-art.ts [--approve]

環境: 在 .env.local 設 OPENAI_API_KEY（與 npm run illustrate 相同）
      可選 OPENAI_IMAGE_MODEL（預設 gpt-image-2）

流程: 生圖 → 審 public/.landing-staging/contact-sheet.jpg → --approve`);
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

type ResolvedCast = { refPaths: string[]; descs: string[]; missing: string[] };

/** cast canonical 名 → 定裝照路徑 + desc（缺檔/缺名冊記錄在 missing）。 */
function resolveCast(cast: readonly string[]): ResolvedCast {
  const roster = readCharacters();
  const byName = new Map(roster.map((c) => [c.name, c] as const));
  const refPaths: string[] = [];
  const descs: string[] = [];
  const missing: string[] = [];
  for (const name of cast) {
    const char = byName.get(name);
    if (!char) {
      missing.push(`${name}（名冊無此角色）`);
      continue;
    }
    // 優先用名冊明確的 ref 欄位（檔名可能 ≠ 角色名，如 藍色小巴士→小藍巴士.jpg）。
    const refPath = char.ref
      ? join(ROOT, "public", char.ref)
      : characterRefFsPath(name);
    if (!existsSync(refPath)) {
      missing.push(`${name}（缺定裝照 ${refPath}）`);
      continue;
    }
    refPaths.push(refPath);
    if (char.desc) descs.push(`${name}: ${char.desc}`);
  }
  return { refPaths, descs, missing };
}

function buildPrompt(scene: string, descs: string[]): string {
  const onModel =
    descs.length > 0
      ? ` Keep these characters exactly on-model — match their colors, proportions, faces and silhouettes from the provided reference image(s): ${descs.join("; ")}. Only change pose, grouping, composition, lighting and background as described.`
      : "";
  return `${CLAY_STYLE_PREFIX}${scene}.${onModel} ${BANNER_SUFFIX} ${VEHICLE_FACE_RULE} ${LANDING_VEHICLE_NEGATIVE} ${CLAY_NEGATIVE}`;
}

async function toBannerJpeg(buf: Buffer): Promise<Buffer> {
  return sharp(buf).resize(1536, 864, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
}

async function generateOne(spec: (typeof LANDING_ART_SPECS)[number]): Promise<Buffer> {
  requireApiKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const { refPaths, descs, missing } = resolveCast(spec.cast);
  if (missing.length > 0) {
    throw new Error(
      `${spec.id} 選角無法對齊定裝照：${missing.join("、")}。請確認 data/characters.json 與 public/characters/。`,
    );
  }
  const prompt = buildPrompt(spec.scene, descs);
  try {
    // on-model：把定裝照當參考圖，與單集插畫 generateSceneImage 同流程。
    const files = await Promise.all(
      refPaths.map((p, i) =>
        toFile(readFileSync(p), `ref${i}.jpg`, { type: "image/jpeg" }),
      ),
    );
    const res = await client.images.edit({
      model: getImageModel(),
      image: files,
      prompt,
      size: "1536x1024",
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("圖像模型未回傳影像");
    return toBannerJpeg(Buffer.from(b64, "base64"));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401") || /Incorrect API key/i.test(msg)) {
      throw new Error(
        "OpenAI 401：API key 無效或已撤銷。請到 platform.openai.com/account/api-keys 重新建立，更新 .env.local 的 OPENAI_API_KEY 後再跑。",
      );
    }
    throw err;
  }
}

async function writeContactSheet(): Promise<string> {
  const segmentFiles = LANDING_ART_SPECS.map((s) => s.file);
  const files = readdirSync(STAGING)
    .filter((f) => f.endsWith(".jpg") && segmentFiles.includes(f))
    .sort((a, b) => segmentFiles.indexOf(a) - segmentFiles.indexOf(b));
  if (files.length === 0) throw new Error("staging 無圖可審");

  const tileW = 480;
  const tileH = 270;
  const cols = 2;
  const rows = Math.ceil(files.length / cols);
  const canvas = sharp({
    create: {
      width: cols * tileW,
      height: rows * tileH,
      channels: 3,
      background: "#ffffff",
    },
  });

  const composites = await Promise.all(
    files.map(async (file, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const input = await sharp(join(STAGING, file))
        .resize(tileW, tileH, { fit: "cover" })
        .toBuffer();
      return { input, left: col * tileW, top: row * tileH };
    }),
  );

  const out = join(STAGING, "contact-sheet.jpg");
  await canvas.composite(composites).jpeg({ quality: 90 }).toFile(out);
  return out;
}

async function runGenerate(onlyIds: string[] | null): Promise<void> {
  mkdirSync(STAGING, { recursive: true });
  const specs = onlyIds
    ? LANDING_ART_SPECS.filter((s) => onlyIds.includes(s.id))
    : [...LANDING_ART_SPECS];
  if (specs.length === 0) {
    throw new Error(
      `無效的 --only。可選：${LANDING_ART_SPECS.map((s) => s.id).join(", ")}`,
    );
  }
  for (const spec of specs) {
    const out = join(STAGING, spec.file);
    console.log(`生圖 ${spec.id}（選角：${spec.cast.join("、")}）→ ${out}`);
    const buf = await generateOne(spec);
    writeFileSync(out, buf);
  }
  const sheet = await writeContactSheet();
  console.log(`完成。請審 contact sheet: ${sheet}`);
  console.log("通過後: npm run generate:landing-art -- --approve");
}

function parseOnlyIds(args: string[]): string[] | null {
  const idx = args.indexOf("--only");
  if (idx === -1) return null;
  const raw = args[idx + 1];
  if (!raw || raw.startsWith("-")) {
    throw new Error("--only 需接 segment id，例如 --only stories,health");
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function runApprove(): void {
  if (!existsSync(STAGING)) {
    throw new Error(
      "找不到 staging 目錄。請先成功執行 npm run generate:landing-art（生圖）再 --approve。",
    );
  }
  const missing = LANDING_ART_SPECS.filter(
    (spec) => !existsSync(join(STAGING, spec.file)),
  );
  if (missing.length > 0) {
    throw new Error(
      `staging 缺 ${missing.length} 張圖（生圖可能因 API key 失敗而中斷）：${missing.map((s) => s.file).join(", ")}。請修正 OPENAI_API_KEY 後重新 npm run generate:landing-art。`,
    );
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of LANDING_ART_SPECS) {
    const src = join(STAGING, spec.file);
    const dest = join(OUT_DIR, spec.file);
    copyFileSync(src, dest);
    console.log(`approve ${dest}`);
  }
}

function runDryRun(onlyIds: string[] | null): void {
  const specs = onlyIds
    ? LANDING_ART_SPECS.filter((s) => onlyIds.includes(s.id))
    : [...LANDING_ART_SPECS];
  if (specs.length === 0) {
    throw new Error(
      `無效的 --only。可選：${LANDING_ART_SPECS.map((s) => s.id).join(", ")}`,
    );
  }
  for (const spec of specs) {
    const { descs, missing } = resolveCast(spec.cast);
    console.log(`\n## ${spec.id} → ${spec.file}`);
    console.log(`選角：${spec.cast.join("、")}`);
    if (missing.length > 0) console.log(`⚠ 缺定裝照：${missing.join("、")}`);
    console.log(buildPrompt(spec.scene, descs));
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
  if (args.includes("--approve")) {
    runApprove();
    return;
  }
  await runGenerate(onlyIds);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
