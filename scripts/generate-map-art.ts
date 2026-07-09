#!/usr/bin/env tsx
/**
 * 宇宙地圖「海／天」黏土素材生圖（gpt-image-2，Art Bible §14）。
 *
 * 沿用島的成功公式：餵黃金樣本 car-park.png 當 style reference，讓海、雲、遠島、
 * 日月與島同一世界（材質／色溫／柔光一致，視角海面可俯視）。透明素材因 gpt-image-2
 * edit 不支援透明底，改「洋紅平背 + chroma-key 去背」（白雲安全，不會被近白 flood 吃掉）。
 *
 * 用法：
 *   npm run generate:map-art -- --dry-run
 *   npm run generate:map-art                     # 日間素材集
 *   npm run generate:map-art -- --night          # 夜間素材集（sea-night）
 *   npm run generate:map-art -- --only sea
 *   npm run generate:map-art -- --approve
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { CLAY_NEGATIVE, getImageModel } from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";

const STAGING = join(ROOT, "public/.map-staging");
const OUT_DIR = join(ROOT, "public/adventures/map");
/** 黃金樣本：所有 map 素材的 style reference（Art Bible §8 鐵律）。 */
const GOLDEN_REF = join(ROOT, "public/adventures/zones/car-park.png");

type ApiSize = "1024x1024" | "1536x1024" | "1024x1536";

type MapArtSpec = {
  id: string;
  file: string;
  /** solid＝實底海面（不去背）；transparent＝洋紅平背 chroma-key 去背。 */
  kind: "solid" | "transparent";
  /** 屬於哪個變體集：day 預設集、night 只在 --night 生。 */
  set: "day" | "night";
  apiSize: ApiSize;
  /** 1x 輸出長邊（px）。@2x 若 needs2x 則為 2 倍（上限＝來源解析度）。 */
  outLong: number;
  needs2x: boolean;
  scene: string;
};

/**
 * map 專用材質 prefix：只保留黏土「材質語彙」，刻意不帶 CLAY_STYLE_PREFIX 的
 * 「anthropomorphic vehicles／single focal subject／off-white background」等主體/背景詞，
 * 避免與滿版海面貼圖及洋紅去背平背衝突。on-model 靠餵 car-park.png 當 style ref。
 */
const MAP_CLAY_STYLE =
  "Children's picture-book clay / plasticine stop-motion style. " +
  "Handmade matte clay, smooth rounded pressed edges, subtle thumbprint texture, " +
  "soft even diffuse lighting, low contrast, no gloss, no reflections, " +
  "pastel storybook palette. ";

const SEA_BASE =
  "Seamless tileable top-down water texture, gentle hand-pressed clay ripples, " +
  "matte plasticine surface with subtle thumbprint dimples, no gloss, no reflections, " +
  "soft even diffuse lighting, low contrast, the edges must tile seamlessly on all four sides.";

const DECOR_BASE =
  "A single isolated clay decoration element, matte plasticine, soft rounded pressed edges, " +
  "soft even diffuse lighting, low contrast, no gloss, no cast-shadow box.";

const REF_RULE =
  " Match the clay material, matte finish, soft even lighting and pastel color temperature " +
  "of the provided reference image; do NOT copy the reference's shapes, buildings or characters.";

const MAP_NEGATIVE =
  " No island, no buildings, no vehicles, no faces, no picture frame, no seam, no tiling artifacts.";

const SPECS: MapArtSpec[] = [
  {
    id: "sea",
    file: "sea.png",
    kind: "solid",
    set: "day",
    apiSize: "1024x1024",
    outLong: 1024,
    needs2x: false,
    scene:
      "Calm shallow lagoon water in soft pastel aqua, light-to-mid teal tones " +
      "(#cfe8f3, #bfe0ef, #a7d2e8), tiny sculpted foam flecks. " +
      SEA_BASE,
  },
  {
    id: "sea-night",
    file: "sea-night.png",
    kind: "solid",
    set: "night",
    apiSize: "1024x1024",
    outLong: 1024,
    needs2x: false,
    scene:
      "Calm night lagoon water in deep desaturated blue-violet (dusk palette), " +
      "gentle moonlit sheen, low saturation, cozy storybook night mood. " +
      SEA_BASE,
  },
  {
    id: "cloud-a",
    file: "cloud-a.png",
    kind: "transparent",
    set: "day",
    apiSize: "1024x1024",
    outLong: 512,
    needs2x: false,
    scene:
      "A soft fluffy white clay cloud, plump rounded puff, gentle pastel highlights. " +
      DECOR_BASE,
  },
  {
    id: "cloud-b",
    file: "cloud-b.png",
    kind: "transparent",
    set: "day",
    apiSize: "1024x1024",
    outLong: 512,
    needs2x: false,
    scene:
      "A soft fluffy white clay cloud, wide gentle puff with two rounded lobes, pastel highlights. " +
      DECOR_BASE,
  },
  {
    id: "cloud-c",
    file: "cloud-c.png",
    kind: "transparent",
    set: "day",
    apiSize: "1024x1024",
    outLong: 512,
    needs2x: false,
    scene:
      "A small soft white clay cloud, single compact puff, pastel highlights. " +
      DECOR_BASE,
  },
  {
    id: "sun",
    file: "sun.png",
    kind: "transparent",
    set: "day",
    apiSize: "1024x1024",
    outLong: 256,
    needs2x: false,
    scene:
      "A round warm clay sun, soft matte warm yellow (#ffd866), gentle rounded rays. " +
      DECOR_BASE,
  },
  {
    id: "moon",
    file: "moon.png",
    kind: "transparent",
    set: "night",
    apiSize: "1024x1024",
    outLong: 256,
    needs2x: false,
    scene:
      "A round pale clay crescent moon, soft matte cream color, cozy night mood. " +
      DECOR_BASE,
  },
];

function usage(): never {
  console.log(`用法:
  generate-map-art.ts [--dry-run] [--night] [--only sea,cloud-a]
  generate-map-art.ts [--approve] [--night]

  海面：sea.png / sea-night.png（實底，無縫平鋪）
  天空：cloud-a/b/c.png、sun.png、moon.png（透明 RGBA）

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

function requireGoldenRef(): void {
  if (!existsSync(GOLDEN_REF)) {
    throw new Error(
      `缺黃金樣本 ${GOLDEN_REF}。map 素材需以 car-park.png 當 style reference（Art Bible §8）。`,
    );
  }
}

function buildPrompt(spec: MapArtSpec): string {
  const bg =
    spec.kind === "transparent"
      ? " On a plain solid flat magenta #FF00FF background only, evenly lit, no pattern, no gradient."
      : "";
  return `${MAP_CLAY_STYLE}${spec.scene}${REF_RULE}${bg} ${CLAY_NEGATIVE}${MAP_NEGATIVE}`;
}

/**
 * 洋紅平背 → 透明：raw 逐像素。
 * 1) 純洋紅（高 R、高 B、低 G）設 alpha=0（保留白雲/奶油色）。
 * 2) 邊緣去溢色（spill suppression）：抗鋸齒邊殘留的洋紅色偏，把 R、B 壓到接近 G，
 *    消除去背後物件邊緣的粉紅描邊，且不影響非洋紅像素（奶油 R≈G≈B、黃色 b<g）。
 */
async function chromaKeyMagenta(buf: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (r > 170 && b > 170 && g < 110) {
      data[i + 3] = 0;
      continue;
    }
    // spill = 洋紅色偏強度（R、B 同時高於 G 的量）。
    const spill = Math.min(r, b) - g;
    if (spill > 0) {
      data[i] = r - spill;
      data[i + 2] = b - spill;
    }
  }
  return sharp(data, { raw: { width, height, channels } }).png().toBuffer();
}

async function postProcess(
  buf: Buffer,
  spec: MapArtSpec,
  density: 1 | 2,
): Promise<Buffer> {
  const long = spec.outLong * density;
  const keyed = spec.kind === "transparent" ? await chromaKeyMagenta(buf) : buf;
  return sharp(keyed)
    .resize(long, long, {
      fit: spec.kind === "solid" ? "cover" : "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

function stagingFile(spec: MapArtSpec, density: 1 | 2): string {
  const name =
    density === 2 ? spec.file.replace(/\.png$/, "@2x.png") : spec.file;
  return join(STAGING, name);
}

async function generateOne(spec: MapArtSpec): Promise<Buffer> {
  requireApiKey();
  requireGoldenRef();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();
  const prompt = buildPrompt(spec);
  try {
    const file = await toFile(readFileSync(GOLDEN_REF), "ref.png", {
      type: "image/png",
    });
    const res = await client.images.edit({
      model: getImageModel(),
      image: [file],
      prompt,
      size: spec.apiSize,
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("圖像模型未回傳影像");
    return Buffer.from(b64, "base64");
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

function selectSpecs(onlyIds: string[] | null, night: boolean): MapArtSpec[] {
  const set = night ? "night" : "day";
  let specs = SPECS.filter((s) => s.set === set);
  if (onlyIds) {
    specs = SPECS.filter((s) => onlyIds.includes(s.id));
    if (specs.length === 0) {
      throw new Error(
        `無效的 --only。可選：${SPECS.map((s) => s.id).join(", ")}`,
      );
    }
  }
  return specs;
}

async function writeContactSheet(specs: MapArtSpec[]): Promise<string> {
  const files = specs
    .map((s) => s.file)
    .filter((f) => existsSync(join(STAGING, f)));
  if (files.length === 0) throw new Error("staging 無圖可審");

  const tile = 320;
  const cols = 2;
  const rows = Math.ceil(files.length / cols);
  const canvas = sharp({
    create: {
      width: cols * tile,
      height: rows * tile,
      channels: 4,
      background: { r: 238, g: 241, b: 246, alpha: 1 },
    },
  });
  const composites = await Promise.all(
    files.map(async (file, i) => {
      const input = await sharp(join(STAGING, file))
        .resize(tile, tile, {
          fit: "contain",
          background: { r: 238, g: 241, b: 246, alpha: 1 },
        })
        .toBuffer();
      return { input, left: (i % cols) * tile, top: Math.floor(i / cols) * tile };
    }),
  );
  const out = join(STAGING, "contact-sheet.jpg");
  await canvas.composite(composites).jpeg({ quality: 90 }).toFile(out);
  return out;
}

async function runGenerate(
  onlyIds: string[] | null,
  night: boolean,
): Promise<void> {
  mkdirSync(STAGING, { recursive: true });
  const specs = selectSpecs(onlyIds, night);
  for (const spec of specs) {
    console.log(`生圖 ${spec.id} → ${stagingFile(spec, 1)}`);
    const raw = await generateOne(spec);
    writeFileSync(stagingFile(spec, 1), await postProcess(raw, spec, 1));
    if (spec.needs2x) {
      writeFileSync(stagingFile(spec, 2), await postProcess(raw, spec, 2));
    }
  }
  const sheet = await writeContactSheet(specs);
  console.log(`完成。請審 contact sheet: ${sheet}`);
  console.log(
    "通過後: npm run generate:map-art -- --approve" + (night ? " --night" : ""),
  );
}

function runApprove(onlyIds: string[] | null, night: boolean): void {
  if (!existsSync(STAGING)) {
    throw new Error(
      "找不到 staging 目錄。請先成功執行 npm run generate:map-art 再 --approve。",
    );
  }
  const specs = selectSpecs(onlyIds, night);
  const densities: (1 | 2)[] = [1, 2];
  const missing: string[] = [];
  for (const spec of specs) {
    for (const d of densities) {
      if (d === 2 && !spec.needs2x) continue;
      if (!existsSync(stagingFile(spec, d))) missing.push(stagingFile(spec, d));
    }
  }
  if (missing.length > 0) {
    throw new Error(`staging 缺圖：${missing.join(", ")}。請先完成生圖。`);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  for (const spec of specs) {
    for (const d of densities) {
      if (d === 2 && !spec.needs2x) continue;
      const name =
        d === 2 ? spec.file.replace(/\.png$/, "@2x.png") : spec.file;
      copyFileSync(join(STAGING, name), join(OUT_DIR, name));
      console.log(`approve ${join(OUT_DIR, name)}`);
    }
  }
}

function parseOnlyIds(args: string[]): string[] | null {
  const idx = args.indexOf("--only");
  if (idx === -1) return null;
  const raw = args[idx + 1];
  if (!raw || raw.startsWith("-")) {
    throw new Error("--only 需接 素材 id，例如 --only sea,cloud-a");
  }
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function runDryRun(onlyIds: string[] | null, night: boolean): void {
  const specs = selectSpecs(onlyIds, night);
  for (const spec of specs) {
    console.log(`\n## ${spec.id} → ${spec.file} (${spec.apiSize}, ${spec.kind})`);
    console.log(buildPrompt(spec));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) usage();
  const night = args.includes("--night");
  const onlyIds = parseOnlyIds(args);
  if (args.includes("--dry-run")) {
    runDryRun(onlyIds, night);
    return;
  }
  if (args.includes("--approve")) {
    runApprove(onlyIds, night);
    return;
  }
  await runGenerate(onlyIds, night);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
