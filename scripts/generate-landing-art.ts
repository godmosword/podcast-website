#!/usr/bin/env tsx
/**
 * Landing Hub segment hero 生圖（gpt-image-2，獨立於 illustrate 管線）。
 *
 * 用法：
 *   npm run generate:landing-art -- --dry-run
 *   npm run generate:landing-art                    # 橫版 16:9
 *   npm run generate:landing-art -- --portrait      # 直版 9:16（行動 ≤768px）
 *   npm run generate:landing-art -- --only stories
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

const VEHICLE_FACE_RULE =
  "Each vehicle has exactly ONE face on the FRONT windshield only; side windows are plain tinted glass with NO face; bumpers and grilles have NO eyes or mouth; headlights are small plain lamps that do NOT look like eyes.";

const LANDING_VEHICLE_NEGATIVE =
  "No face on bumper. No face on grille. Headlights must NOT look like eyes. No duplicate facial features anywhere on the vehicle body.";

const BANNER_SUFFIX =
  "Wide 16:9 hero banner composition for a children's website section header. No text, no logos, no watermark.";

const PORTRAIT_SUFFIX =
  "Vertical 9:16 portrait hero for mobile website. Main subjects centered in the upper 55% of the frame. Keep the bottom 35% darker and simpler (soft gradient or empty ground) for white title text overlay. No text, no logos, no watermark.";

type Orientation = "landscape" | "portrait";

type LandingArtSpec = {
  id: string;
  cast: readonly string[];
  landscape: { file: string; scene: string };
  portrait: { file: string; scene: string };
};

/**
 * cast = data/characters.json canonical 名；定裝照 → images.edit（on-model）。
 * scene 只描述動作／構圖／氛圍，外觀交給定裝照 + desc。
 */
const LANDING_ART_SPECS: LandingArtSpec[] = [
  {
    id: "stories",
    cast: ["恐龍車多多", "安安救護車", "東東挖土機", "小紅賽車"],
    landscape: {
      file: "segment-stories.jpg",
      scene:
        "The provided vehicle friends playing together in a colorful clay amusement park (ferris wheel, carousel) on a warm sunny day; inviting storybook group scene; leave clean negative space in the upper-left for a title overlay. " +
        VEHICLE_FACE_RULE,
    },
    portrait: {
      file: "segment-stories-portrait.jpg",
      scene:
        "The provided four vehicle friends stacked in a gentle vertical group portrait — dinosaur car on top, ambulance and excavator in the middle row, red race car at bottom — all facing camera with happy smiles. Behind them a soft clay amusement park (ferris wheel peeking above, carousel hints) under warm sunny sky. Vertical portrait composition, all four characters fully visible without cropping faces or wheels.",
    },
  },
  {
    id: "bedtime",
    cast: ["藍色小巴士"],
    landscape: {
      file: "segment-bedtime.jpg",
      scene:
        "Cozy night scene with the provided blue minibus parked calmly on a soft green hill; crescent moon and stars; three sleeping fluffy clay sheep nearby; sleepy, calm, low-light palette; leave clean negative space in the upper area for a title overlay. " +
        VEHICLE_FACE_RULE,
    },
    portrait: {
      file: "segment-bedtime-portrait.jpg",
      scene:
        "Cozy night vertical scene: the provided blue minibus parked on a soft green hill, viewed from a slight front angle. Crescent moon and tiny stars in a deep blue-violet sky above. Two or three fluffy clay sheep sleeping peacefully near the bus wheels. Calm, sleepy mood, low saturated night palette with soft moonlight.",
    },
  },
  {
    id: "clay",
    cast: ["恐龍車多多"],
    landscape: {
      file: "segment-clay.jpg",
      scene:
        "Child-friendly hands gently shaping the provided clay vehicle on a craft table; rainbow clay blobs and simple sculpting tools around; playful hands-on craft mood; bright studio light; leave clean negative space on one side for a title overlay. " +
        VEHICLE_FACE_RULE,
    },
    portrait: {
      file: "segment-clay-portrait.jpg",
      scene:
        "Vertical craft-table scene: child's hands gently shaping the provided dinosaur clay vehicle on a wooden table. Rainbow clay blobs and simple sculpting tools arranged around the workspace. Bright warm studio light from above-left. Playful hands-on mood, focus on the clay car and hands in the upper frame.",
    },
  },
  {
    id: "health",
    cast: ["安安救護車", "亮亮警車"],
    landscape: {
      file: "segment-health.jpg",
      scene:
        "The provided vehicle friends demonstrating healthy daily habits — one brushing teeth, one waiting safely at a crosswalk with a traffic light; warm, gentle educational tone; clay checklist props; leave clean negative space in the upper area for a title overlay. " +
        VEHICLE_FACE_RULE,
    },
    portrait: {
      file: "segment-health-portrait.jpg",
      scene:
        "Vertical toddler health-education scene (衛教宣導): the provided ambulance friend actively demonstrating tooth-brushing — tiny clay toothbrush raised in a natural, gentle brushing motion toward its friendly windshield smile, body slightly tilted forward as if mid-lesson; the provided police car friend paused calmly at a zebra crosswalk beside a small clay traffic light, modeling safe crossing with a relaxed attentive pose angled slightly toward the ambulance. A simple clay health poster board between them shows cute icons (tooth, soap, apple, bandage). Warm soft daylight, friendly neighborhood health-talk mood — lifelike relaxed poses and subtle interaction, not stiff parked side-by-side. Clear health-education storytelling in the upper frame.",
    },
  },
];

function usage(): never {
  console.log(`用法:
  generate-landing-art.ts [--dry-run] [--portrait] [--only stories,health]
  generate-landing-art.ts [--approve] [--portrait]

  橫版：segment-{id}.jpg（1536×864）
  直版：segment-{id}-portrait.jpg（1024×1536，行動 ≤768px）

環境: .env.local 的 OPENAI_API_KEY（與 npm run illustrate 相同）
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

type ResolvedCast = { refPaths: string[]; descs: string[]; missing: string[] };

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

function buildPrompt(
  scene: string,
  descs: string[],
  orientation: Orientation,
): string {
  const onModel =
    descs.length > 0
      ? ` Keep these characters exactly on-model — match their colors, proportions, faces and silhouettes from the provided reference image(s): ${descs.join("; ")}. Only change pose, grouping, composition, lighting and background as described.`
      : "";
  const suffix =
    orientation === "portrait" ? PORTRAIT_SUFFIX : BANNER_SUFFIX;
  const faceRule =
    orientation === "portrait" ? ` ${VEHICLE_FACE_RULE}` : "";
  return `${CLAY_STYLE_PREFIX}${scene}.${onModel} ${suffix}${faceRule} ${LANDING_VEHICLE_NEGATIVE} ${CLAY_NEGATIVE}`;
}

async function toOutputJpeg(
  buf: Buffer,
  orientation: Orientation,
): Promise<Buffer> {
  if (orientation === "portrait") {
    return sharp(buf)
      .resize(1024, 1536, { fit: "cover" })
      .jpeg({ quality: 88 })
      .toBuffer();
  }
  return sharp(buf)
    .resize(1536, 864, { fit: "cover" })
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function generateOne(
  spec: LandingArtSpec,
  orientation: Orientation,
): Promise<Buffer> {
  requireApiKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const { refPaths, descs, missing } = resolveCast(spec.cast);
  if (missing.length > 0) {
    throw new Error(
      `${spec.id} 選角無法對齊定裝照：${missing.join("、")}。請確認 data/characters.json 與 public/characters/。`,
    );
  }
  const variant = orientation === "portrait" ? spec.portrait : spec.landscape;
  const prompt = buildPrompt(variant.scene, descs, orientation);
  const apiSize = orientation === "portrait" ? "1024x1536" : "1536x1024";
  try {
    const files = await Promise.all(
      refPaths.map((p, i) =>
        toFile(readFileSync(p), `ref${i}.jpg`, { type: "image/jpeg" }),
      ),
    );
    const res = await client.images.edit({
      model: getImageModel(),
      image: files,
      prompt,
      size: apiSize,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("圖像模型未回傳影像");
    return toOutputJpeg(Buffer.from(b64, "base64"), orientation);
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

function specOutputFiles(orientation: Orientation): string[] {
  return LANDING_ART_SPECS.map((s) =>
    orientation === "portrait" ? s.portrait.file : s.landscape.file,
  );
}

async function writeContactSheet(orientation: Orientation): Promise<string> {
  const segmentFiles = specOutputFiles(orientation);
  const files = readdirSync(STAGING)
    .filter((f) => f.endsWith(".jpg") && segmentFiles.includes(f))
    .sort((a, b) => segmentFiles.indexOf(a) - segmentFiles.indexOf(b));
  if (files.length === 0) throw new Error("staging 無圖可審");

  const portrait = orientation === "portrait";
  const tileW = portrait ? 270 : 480;
  const tileH = portrait ? 480 : 270;
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

  const sheetName =
    orientation === "portrait"
      ? "contact-sheet-portrait.jpg"
      : "contact-sheet.jpg";
  const out = join(STAGING, sheetName);
  await canvas.composite(composites).jpeg({ quality: 90 }).toFile(out);
  return out;
}

async function runGenerate(
  onlyIds: string[] | null,
  orientation: Orientation,
): Promise<void> {
  mkdirSync(STAGING, { recursive: true });
  const specs = onlyIds
    ? LANDING_ART_SPECS.filter((s) => onlyIds.includes(s.id))
    : [...LANDING_ART_SPECS];
  if (specs.length === 0) {
    throw new Error(
      `無效的 --only。可選：${LANDING_ART_SPECS.map((s) => s.id).join(", ")}`,
    );
  }
  const label = orientation === "portrait" ? "直版" : "橫版";
  for (const spec of specs) {
    const variant =
      orientation === "portrait" ? spec.portrait : spec.landscape;
    const out = join(STAGING, variant.file);
    console.log(
      `生圖 ${label} ${spec.id}（選角：${spec.cast.join("、")}）→ ${out}`,
    );
    const buf = await generateOne(spec, orientation);
    writeFileSync(out, buf);
  }
  const sheet = await writeContactSheet(orientation);
  console.log(`完成。請審 contact sheet: ${sheet}`);
  console.log("通過後: npm run generate:landing-art -- --approve" +
    (orientation === "portrait" ? " --portrait" : ""));
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

function runApprove(orientation: Orientation): void {
  if (!existsSync(STAGING)) {
    throw new Error(
      "找不到 staging 目錄。請先成功執行 npm run generate:landing-art 再 --approve。",
    );
  }
  const specs = LANDING_ART_SPECS.map((s) =>
    orientation === "portrait" ? s.portrait : s.landscape,
  );
  const missing = specs.filter(
    (variant) => !existsSync(join(STAGING, variant.file)),
  );
  if (missing.length > 0) {
    throw new Error(
      `staging 缺 ${missing.length} 張圖：${missing.map((v) => v.file).join(", ")}。請先完成生圖。`,
    );
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const variant of specs) {
    const src = join(STAGING, variant.file);
    const dest = join(OUT_DIR, variant.file);
    copyFileSync(src, dest);
    console.log(`approve ${dest}`);
  }
}

function runDryRun(
  onlyIds: string[] | null,
  orientation: Orientation,
): void {
  const specs = onlyIds
    ? LANDING_ART_SPECS.filter((s) => onlyIds.includes(s.id))
    : [...LANDING_ART_SPECS];
  if (specs.length === 0) {
    throw new Error(
      `無效的 --only。可選：${LANDING_ART_SPECS.map((s) => s.id).join(", ")}`,
    );
  }
  for (const spec of specs) {
    const variant =
      orientation === "portrait" ? spec.portrait : spec.landscape;
    const { descs, missing } = resolveCast(spec.cast);
    console.log(
      `\n## ${spec.id} → ${variant.file} (${orientation === "portrait" ? "9:16" : "16:9"})`,
    );
    console.log(`選角：${spec.cast.join("、")}`);
    if (missing.length > 0) console.log(`⚠ 缺定裝照：${missing.join("、")}`);
    console.log(buildPrompt(variant.scene, descs, orientation));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) usage();
  const portrait = args.includes("--portrait");
  const orientation: Orientation = portrait ? "portrait" : "landscape";
  const onlyIds = parseOnlyIds(args);
  if (args.includes("--dry-run")) {
    runDryRun(onlyIds, orientation);
    return;
  }
  if (args.includes("--approve")) {
    runApprove(orientation);
    return;
  }
  await runGenerate(onlyIds, orientation);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
