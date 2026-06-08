// ============================================================
// 車車遊樂園 — 每集劇情插圖生成核心
// ============================================================
// 由字幕側車檔（data/subtitles/<slug>.json）切場景 → 每幕生黏土風插圖
// → 暫存 + contact sheet 人工審 → --approve 進 public/ 並寫 pageCount/captionTimes。
//
// 隱私：送出的是已公開的劇本文字（非音檔）。需 OPENAI_API_KEY。
// 本機手動執行、人工審圖；CI 不放 key、不生圖。
// ============================================================

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { z } from "zod";
import { ROOT, STORIES_DIR, subtitleSidecarPath } from "./transcribe-core";

// ── 型別 ────────────────────────────────────────────────
export interface Subtitle {
  t: number;
  text: string;
}

export interface Scene {
  index: number; // 1-based
  start: number; // 秒，對齊某句字幕的起始
  end: number; // 秒
  summary: string; // 中文，給 contact sheet
  prompt: string; // 英文，給圖像模型
}

export interface ScenesFile {
  slug: string;
  audioDuration: number;
  model: string;
  generatedAt: string;
  scenes: Scene[];
}

export interface StoryMeta {
  title?: string;
  vehicle?: string;
}

// ── 路徑 ────────────────────────────────────────────────
export const SCENES_DIR = join(ROOT, "data", "scenes");
export const STAGING_DIR = join(ROOT, "public", ".illustrate-staging");
const DEFAULTS_PATH = join(ROOT, "data", "apple-sync.defaults.json");

export function scenesSidecarPath(slug: string): string {
  return join(SCENES_DIR, `${slug}.json`);
}
export function stagingDirForSlug(slug: string): string {
  return join(STAGING_DIR, slug);
}
export function publicDirForSlug(slug: string): string {
  return join(STORIES_DIR, slug);
}
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// ── 場景長度目標（秒）─────────────────────────────────────
const TARGET_MIN = 30;
const TARGET_MAX = 60;
const HARD_MIN = 25; // 短於此併入鄰幕
const HARD_MAX = 75; // 長於此再切

// ── 黏土風格 prompt（萃取自 DESIGN.md）──────────────────────
export const CLAY_STYLE_PREFIX =
  "Children's picture-book illustration in soft claymation / plasticine stop-motion style. " +
  "Rounded friendly clay shapes, smooth matte surfaces, soft studio lighting, gentle shadows. " +
  "Pastel palette (blush pink #f7a8c4, warm yellow #ffd866, fresh mint #b7df9b, sky blue #8fcde8, teal #79c8c1, lilac #c5b3e6) on a clean off-white background. " +
  "Cute anthropomorphic vehicles with simple dot eyes and warm smiles, toddler-safe and cozy. " +
  "Single clear focal subject, simple uncluttered composition. ";

export const CLAY_NEGATIVE =
  "No text, no words, no captions, no logos, no watermark. No scary or violent imagery. No realistic humans. No photorealism.";

// ── 字幕讀取 ─────────────────────────────────────────────
export function readSubtitles(slug: string): Subtitle[] {
  const p = subtitleSidecarPath(slug);
  if (!existsSync(p)) {
    throw new Error(
      `找不到字幕側車檔 ${p}；請先 npm run transcribe -- ${slug}`,
    );
  }
  const raw: unknown = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`字幕格式錯誤：${p}`);
  const subs = raw.filter(
    (s): s is Subtitle =>
      typeof s === "object" &&
      s !== null &&
      typeof (s as Subtitle).t === "number" &&
      typeof (s as Subtitle).text === "string",
  );
  if (subs.length === 0) throw new Error(`字幕為空：${p}`);
  return subs;
}

/** 估整集音檔長度（秒）：最後一句起始 + 緩衝。 */
export function estimateDuration(subs: Subtitle[]): number {
  return Math.ceil(subs[subs.length - 1].t + 5);
}

// ── 後處理：把場景夾在 25–75 秒、邊界落在句界 ──────────────────
function buildScenesFromStartIndices(
  subs: Subtitle[],
  startIndices: number[],
  duration: number,
  summaries: string[],
  prompts: string[],
): Scene[] {
  // 去重、排序、確保第一幕從 0 開始
  const idx = Array.from(new Set(startIndices)).sort((a, b) => a - b);
  if (idx[0] !== 0) idx.unshift(0);

  const raw = idx.map((startIdx, i) => {
    const start = subs[startIdx].t;
    const nextIdx = idx[i + 1];
    const end = nextIdx != null ? subs[nextIdx].t : duration;
    return { startIdx, start, end, summary: summaries[i] ?? "", prompt: prompts[i] ?? "" };
  });

  // 併入過短的場景（往前一幕合併）
  const merged: typeof raw = [];
  for (const sc of raw) {
    const prev = merged[merged.length - 1];
    if (prev && sc.end - prev.start < HARD_MIN) {
      prev.end = sc.end; // 延長前一幕
    } else {
      merged.push({ ...sc });
    }
  }

  // 切開過長的場景（在最近的句界，朝 TARGET_MAX 切）
  const split: typeof merged = [];
  for (const sc of merged) {
    let segStart = sc.start;
    while (sc.end - segStart > HARD_MAX) {
      const cutTime = segStart + TARGET_MAX;
      const cutSub = subs.find((s) => s.t >= cutTime);
      const cut = cutSub ? cutSub.t : sc.end;
      if (cut <= segStart || cut >= sc.end) break;
      split.push({ ...sc, start: segStart, end: cut });
      segStart = cut;
    }
    split.push({ ...sc, start: segStart, end: sc.end });
  }

  return split.map((sc, i) => ({
    index: i + 1,
    start: Math.round(sc.start * 10) / 10,
    end: Math.round(sc.end * 10) / 10,
    summary: sc.summary,
    prompt: sc.prompt,
  }));
}

/** 拼一個場景的台詞（給生圖 prompt 補語境）。 */
function sceneDialogue(subs: Subtitle[], start: number, end: number): string {
  return subs
    .filter((s) => s.t >= start && s.t < end)
    .map((s) => s.text)
    .join(" ");
}

// ── ① 切場景：純時間（keyless 後備）──────────────────────────
export function segmentDeterministic(
  subs: Subtitle[],
  duration: number,
): Scene[] {
  const startIndices: number[] = [];
  let bucketStart = subs[0].t;
  subs.forEach((s, i) => {
    if (i === 0) {
      startIndices.push(0);
      return;
    }
    if (s.t - bucketStart >= TARGET_MIN) {
      startIndices.push(i);
      bucketStart = s.t;
    }
  });
  const scenes = buildScenesFromStartIndices(subs, startIndices, duration, [], []);
  // 用台詞片段當 summary、英文 prompt 先放占位（deterministic 無語意理解）
  return scenes.map((sc) => {
    const dlg = sceneDialogue(subs, sc.start, sc.end);
    return {
      ...sc,
      summary: dlg.slice(0, 40),
      prompt: `A cozy scene from a toddler car story. Context: ${dlg.slice(0, 200)}`,
    };
  });
}

// ── ① 切場景：OpenAI 文字模型（主要）────────────────────────
const SceneLLMSchema = z.object({
  scenes: z
    .array(
      z.object({
        startIndex: z.number().int().nonnegative(),
        summary: z.string().min(1),
        prompt: z.string().min(1),
      }),
    )
    .min(1),
});

export function getTextModel(): string {
  return process.env.OPENAI_TEXT_MODEL ?? "gpt-4o";
}
export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
}

function requireKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "缺 OPENAI_API_KEY。請設環境變數後再跑（見 .env.example）。\n" +
        "  或加 --deterministic 用本機切場景（不生圖、不需 key）。",
    );
  }
  return key;
}

export async function segmentByOpenAI(
  subs: Subtitle[],
  duration: number,
  meta: StoryMeta,
): Promise<Scene[]> {
  requireKey();
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();

  const lines = subs.map((s, i) => `${i}\t${s.t}\t${s.text}`).join("\n");
  const system =
    "You segment a children's audio story transcript into visual scenes for a picture book. " +
    "Each scene should span roughly 30-60 seconds of audio and break on plot beats (new place, new action, new emotion). " +
    "Return JSON {scenes:[{startIndex, summary, prompt}]}. " +
    "startIndex = index of the FIRST transcript line of that scene (strictly increasing, the first scene MUST start at index 0). " +
    "summary = a short Traditional Chinese phrase describing the scene. " +
    "prompt = an English image prompt naming the protagonist vehicle, its action, and the mood (no style words, no text in image).";
  const user =
    `Episode title: ${meta.title ?? "(unknown)"}\n` +
    `Protagonist vehicle: ${meta.vehicle ?? "(a friendly car)"}\n` +
    `Audio duration: ${duration}s\n\n` +
    `Transcript (index<TAB>seconds<TAB>text):\n${lines}`;

  const resp = await client.chat.completions.create({
    model: getTextModel(),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const content = resp.choices[0]?.message?.content ?? "{}";
  const parsed = SceneLLMSchema.parse(JSON.parse(content));

  const valid = parsed.scenes
    .filter((s) => s.startIndex < subs.length)
    .sort((a, b) => a.startIndex - b.startIndex);
  if (valid.length === 0) throw new Error("OpenAI 切場景回傳空結果");

  const scenes = buildScenesFromStartIndices(
    subs,
    valid.map((s) => s.startIndex),
    duration,
    valid.map((s) => s.summary),
    valid.map((s) => s.prompt),
  );
  return scenes;
}

// ── 場景檔讀寫 ───────────────────────────────────────────
export function writeScenesFile(file: ScenesFile): string {
  mkdirSync(SCENES_DIR, { recursive: true });
  const p = scenesSidecarPath(file.slug);
  writeFileSync(p, `${JSON.stringify(file, null, 2)}\n`, "utf8");
  return p;
}
export function readScenesFile(slug: string): ScenesFile {
  const p = scenesSidecarPath(slug);
  if (!existsSync(p)) throw new Error(`找不到場景檔 ${p}；請先跑 npm run illustrate -- ${slug} --segment-only`);
  return JSON.parse(readFileSync(p, "utf8")) as ScenesFile;
}

// ── ② 生圖（OpenAI 圖像模型 + 參考圖）──────────────────────
const TARGET_PX = 1400;

/** 把模型回傳的 PNG buffer 轉成 1400×1400 JPEG（對齊既有資產）。 */
async function toStandardJpeg(buf: Buffer): Promise<Buffer> {
  return sharp(buf)
    .resize(TARGET_PX, TARGET_PX, { fit: "cover" })
    .jpeg({ quality: 88 })
    .toBuffer();
}

/**
 * 生成單幕插圖。以該集既有 01.jpg 當風格/角色參考（OpenAI images.edit）。
 * 回傳 1400×1400 JPEG buffer。
 */
export async function generateSceneImage(
  scene: Scene,
  refImagePath: string,
): Promise<Buffer> {
  requireKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();

  const prompt = `${CLAY_STYLE_PREFIX}Scene: ${scene.prompt}. ${CLAY_NEGATIVE}`;

  if (existsSync(refImagePath)) {
    const ref = await toFile(readFileSync(refImagePath), "ref.jpg", {
      type: "image/jpeg",
    });
    const res = await client.images.edit({
      model: getImageModel(),
      image: ref,
      prompt,
      size: "1024x1024",
    });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("圖像模型未回傳影像（edit）");
    return toStandardJpeg(Buffer.from(b64, "base64"));
  }

  const res = await client.images.generate({
    model: getImageModel(),
    prompt,
    size: "1024x1024",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("圖像模型未回傳影像（generate）");
  return toStandardJpeg(Buffer.from(b64, "base64"));
}

export function writeStagingImage(slug: string, index: number, buf: Buffer): string {
  const dir = stagingDirForSlug(slug);
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `${pad2(index)}.jpg`);
  writeFileSync(p, buf);
  return p;
}

// ── ③ contact sheet（純 HTML，人工審）──────────────────────
export function buildContactSheet(slug: string, scenes: Scene[]): string {
  const dir = stagingDirForSlug(slug);
  mkdirSync(dir, { recursive: true });
  const cards = scenes
    .map((sc) => {
      const fmt = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
      return `
    <figure>
      <img src="./${pad2(sc.index)}.jpg" alt="" loading="lazy" />
      <figcaption>
        <b>#${sc.index}</b> ${fmt(sc.start)}–${fmt(sc.end)}（${Math.round(sc.end - sc.start)}s）<br/>
        <span class="zh">${escapeHtml(sc.summary)}</span><br/>
        <span class="en">${escapeHtml(sc.prompt)}</span>
      </figcaption>
    </figure>`;
    })
    .join("\n");

  const html = `<!doctype html><meta charset="utf-8" />
<title>${slug} — 插圖審稿</title>
<style>
  body{font-family:system-ui,"PingFang TC",sans-serif;background:#fafafa;margin:24px;color:#222}
  h1{font-size:20px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
  figure{margin:0;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden}
  img{width:100%;display:block;aspect-ratio:1/1;object-fit:cover;background:#eee}
  figcaption{padding:8px 10px;font-size:12px;line-height:1.5}
  .zh{font-weight:700}
  .en{color:#666}
  .note{color:#a00;font-weight:700;margin:6px 0 18px}
</style>
<h1>🎬 ${slug} — 共 ${scenes.length} 幕插圖審稿</h1>
<p class="note">⚠️ 兒童內容：逐幕檢查有無走樣／不適／文字。壞幕用 <code>npm run illustrate -- ${slug} --scene N</code> 重抽；全部 OK 用 <code>--approve</code> 上線。</p>
<div class="grid">${cards}</div>
`;
  const p = join(dir, "contact.html");
  writeFileSync(p, html, "utf8");
  return p;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── ③ approve：暫存 → public + 寫接線 ──────────────────────
export interface ApproveResult {
  copied: number;
  publicDir: string;
  captionTimes: number[];
  wiredVia: "overrides" | "manual-instructions";
}

export function approve(slug: string): ApproveResult {
  const scenesFile = readScenesFile(slug);
  const staging = stagingDirForSlug(slug);
  const scenes = scenesFile.scenes;

  // 確認每幕暫存圖都在
  for (const sc of scenes) {
    const img = join(staging, `${pad2(sc.index)}.jpg`);
    if (!existsSync(img)) {
      throw new Error(`缺暫存圖 ${img}；請先跑 npm run illustrate -- ${slug}（必要時 --scene ${sc.index}）`);
    }
  }

  // 複製進 public，並清掉舊的多餘頁（避免殘留 N+1.jpg）
  const pub = publicDirForSlug(slug);
  mkdirSync(pub, { recursive: true });
  for (const f of readdirSync(pub)) {
    if (/^\d{2}\.jpg$/.test(f)) rmSync(join(pub, f));
  }
  for (const sc of scenes) {
    copyFileSync(join(staging, `${pad2(sc.index)}.jpg`), join(pub, `${pad2(sc.index)}.jpg`));
  }

  const captionTimes = scenes.map((s) => s.start);
  const wiredVia = writeWiring(slug, scenes.length, captionTimes);
  return { copied: scenes.length, publicDir: pub, captionTimes, wiredVia };
}

/**
 * 寫 pageCount/captionTimes：
 * - 同步集（ep-N）：寫進 apple-sync.defaults.json 的 overrides.<slug>，
 *   下次 npm run sync:apple 會併入 apple-synced.json。
 * - 手動集：無法安全程式化改 stories.ts，印出手動指示。
 */
const SYNCED_PATH = join(ROOT, "data", "apple-synced.json");

/** 直接把 pageCount/captionTimes 寫進已 baked 的 apple-synced.json 的該集（立即生效）。 */
function materializeIntoSynced(
  slug: string,
  pageCount: number,
  captionTimes: number[],
): boolean {
  if (!existsSync(SYNCED_PATH)) return false;
  const synced = JSON.parse(readFileSync(SYNCED_PATH, "utf8")) as Record<
    string,
    unknown
  >[];
  const entry = synced.find((s) => s.slug === slug);
  if (!entry) return false;
  entry.pageCount = pageCount;
  entry.captionTimes = captionTimes;
  writeFileSync(SYNCED_PATH, `${JSON.stringify(synced, null, 2)}\n`, "utf8");
  return true;
}

function writeWiring(
  slug: string,
  pageCount: number,
  captionTimes: number[],
): "overrides" | "manual-instructions" {
  if (/^ep-\d+$/.test(slug)) {
    // overrides：未來 re-sync 重 bake 時的耐久來源
    const defaults = JSON.parse(readFileSync(DEFAULTS_PATH, "utf8")) as {
      overrides: Record<string, Record<string, unknown>>;
    };
    defaults.overrides ??= {};
    defaults.overrides[slug] = {
      ...defaults.overrides[slug],
      pageCount,
      captionTimes,
    };
    writeFileSync(DEFAULTS_PATH, `${JSON.stringify(defaults, null, 2)}\n`, "utf8");
    // 同步集若已 baked，直接寫進 apple-synced.json 立即生效（不必等 RSS 變動才 re-bake）
    materializeIntoSynced(slug, pageCount, captionTimes);
    return "overrides";
  }
  console.log(
    `\n手動集 ${slug}：請在 data/stories.ts 的該集物件設\n` +
      `  pageCount: ${pageCount},\n` +
      `  captionTimes: ${JSON.stringify(captionTimes)},\n`,
  );
  return "manual-instructions";
}
