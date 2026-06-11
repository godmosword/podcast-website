// ============================================================
// 車車遊樂園 — 每集劇情插圖生成核心
// ============================================================
// 由字幕側車檔（data/subtitles/<slug>.json）切場景 → 每幕生黏土風插圖
// → 暫存 + contact sheet 人工審 → --approve 進 public/ 並寫 pageCount/captionTimes。
//
// 角色一致：data/characters.json 為跨集角色名冊；每個角色有 canonical 定裝照
// public/characters/<name>.jpg。生圖時把該幕出場角色的定裝照當參考圖，跨集維持形象。
// 新角色首次登場時自動產定裝照（暫存），--approve 後存進名冊。
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
  characters: string[]; // 該幕出場的角色 canonical 名稱
  /** 沿用 public/stories/<slug>/NN.jpg（Apple 封面等），不生新圖、approve 時優先保留 */
  keepCover?: boolean;
  /** 生圖時額外附上已發佈的 NN.jpg 當視覺參考（連戲用，如 #21 參考 #20） */
  refPages?: number[];
}

export interface NewCharacter {
  name: string; // canonical 中文名（如 多多）
  aliases: string[]; // whisper 可能的誤聽（朵朵…）
  vehicle?: string;
  desc: string; // 英文外觀描述，給生圖穩定形象
}

export interface ScenesFile {
  slug: string;
  audioDuration: number;
  model: string;
  generatedAt: string;
  scenes: Scene[];
  newCharacters: NewCharacter[];
}

/** 名冊一筆。以 name 為 key。 */
export interface Character {
  name: string;
  aliases: string[];
  vehicle?: string;
  desc: string;
  ref?: string; // web 路徑，如 "characters/多多.jpg"
  firstSeen?: string; // 首次登場的 slug
}

export interface StoryMeta {
  title?: string;
  vehicle?: string;
}

// ── 路徑 ────────────────────────────────────────────────
export const SCENES_DIR = join(ROOT, "data", "scenes");
export const STAGING_DIR = join(ROOT, "public", ".illustrate-staging");
export const CHARACTERS_DIR = join(ROOT, "public", "characters");
const CHARACTERS_PATH = join(ROOT, "data", "characters.json");
const DEFAULTS_PATH = join(ROOT, "data", "apple-sync.defaults.json");
const SYNCED_PATH = join(ROOT, "data", "apple-synced.json");

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
/** 角色名 → 檔名安全字串（保留中日韓字、英數、-、_）。 */
function safeName(name: string): string {
  return name.replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 40) || "char";
}
export function characterRefFsPath(name: string): string {
  return join(CHARACTERS_DIR, `${safeName(name)}.jpg`);
}
export function stagingPortraitPath(slug: string, name: string): string {
  return join(stagingDirForSlug(slug), `_char-${safeName(name)}.jpg`);
}

// ── 場景長度目標（秒，對齊 ep-9 manual-semantic-15-20s）────────
const TARGET_MIN = 15;
const TARGET_MAX = 20;
const HARD_MIN = 12;
const HARD_MAX = 28;
const INTRO_MAX = 50;

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
    throw new Error(`找不到字幕側車檔 ${p}；請先 npm run transcribe -- ${slug}`);
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

export function estimateDuration(subs: Subtitle[]): number {
  return Math.ceil(subs[subs.length - 1].t + 5);
}

// ── 名冊讀寫 ─────────────────────────────────────────────
export function readCharacters(): Character[] {
  if (!existsSync(CHARACTERS_PATH)) return [];
  const raw: unknown = JSON.parse(readFileSync(CHARACTERS_PATH, "utf8"));
  return Array.isArray(raw) ? (raw as Character[]) : [];
}
function writeCharacters(chars: Character[]): void {
  writeFileSync(CHARACTERS_PATH, `${JSON.stringify(chars, null, 2)}\n`, "utf8");
}
function charByName(chars: Character[]): Map<string, Character> {
  return new Map(chars.map((c) => [c.name, c]));
}

// ── 後處理：把場景夾在 12–28 秒（開場可至 INTRO_MAX）、邊界落在句界 ──
interface RawScene {
  startIdx: number;
  start: number;
  end: number;
  summary: string;
  prompt: string;
  characters: string[];
}

function buildScenes(
  subs: Subtitle[],
  startIndices: number[],
  duration: number,
  summaries: string[],
  prompts: string[],
  charactersArr: string[][],
): Scene[] {
  const idx = Array.from(new Set(startIndices)).sort((a, b) => a - b);
  if (idx[0] !== 0) idx.unshift(0);

  const raw: RawScene[] = idx.map((startIdx, i) => {
    const start = subs[startIdx].t;
    const nextIdx = idx[i + 1];
    const end = nextIdx != null ? subs[nextIdx].t : duration;
    return {
      startIdx,
      start,
      end,
      summary: summaries[i] ?? "",
      prompt: prompts[i] ?? "",
      characters: charactersArr[i] ?? [],
    };
  });

  // 併入過短場景（單幕 < HARD_MIN 秒則併入上一幕，角色取聯集）
  const merged: RawScene[] = [];
  for (const sc of raw) {
    const prev = merged[merged.length - 1];
    if (prev && sc.end - sc.start < HARD_MIN) {
      prev.end = sc.end;
      prev.characters = [...new Set([...prev.characters, ...sc.characters])];
    } else {
      merged.push({ ...sc });
    }
  }

  // 切開過長場景（最近句界）
  const split: RawScene[] = [];
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
    characters: sc.characters,
  }));
}

function sceneDialogue(subs: Subtitle[], start: number, end: number): string {
  return subs
    .filter((s) => s.t >= start && s.t < end)
    .map((s) => s.text)
    .join(" ");
}

// ── ① 切場景：純時間（keyless 後備，無角色辨識）──────────────
export function segmentDeterministic(
  subs: Subtitle[],
  duration: number,
): { scenes: Scene[]; newCharacters: NewCharacter[] } {
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
  const scenes = buildScenes(subs, startIndices, duration, [], [], []).map((sc) => {
    const dlg = sceneDialogue(subs, sc.start, sc.end);
    return {
      ...sc,
      summary: dlg.slice(0, 40),
      prompt: `A cozy scene from a toddler car story. Context: ${dlg.slice(0, 200)}`,
    };
  });
  return { scenes, newCharacters: [] };
}

// ── ① 切場景：OpenAI 文字模型（含角色辨識）────────────────────
const SegmentSchema = z.object({
  scenes: z
    .array(
      z.object({
        startIndex: z.number().int().nonnegative(),
        summary: z.string().min(1),
        prompt: z.string().min(1),
        characters: z.array(z.string()).default([]),
      }),
    )
    .min(1),
  newCharacters: z
    .array(
      z.object({
        name: z.string().min(1),
        aliases: z.array(z.string()).default([]),
        vehicle: z
          .string()
          .nullish()
          .transform((v) => v ?? undefined),
        desc: z.string().min(1),
      }),
    )
    .default([]),
});

export function getTextModel(): string {
  return process.env.OPENAI_TEXT_MODEL ?? "gpt-4o";
}
export function getImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";
}

function requireKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "缺 OPENAI_API_KEY。請設環境變數（或 .env.local）後再跑（見 .env.example）。\n" +
        "  或加 --deterministic 用本機切場景（不生圖、不需 key）。",
    );
  }
}

export async function segmentByOpenAI(
  subs: Subtitle[],
  duration: number,
  meta: StoryMeta,
): Promise<{ scenes: Scene[]; newCharacters: NewCharacter[] }> {
  requireKey();
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();

  const roster = readCharacters();
  const rosterText =
    roster.length > 0
      ? roster
          .map(
            (c) =>
              `- ${c.name} (aliases: ${c.aliases.join("/") || "—"}; ${c.vehicle ?? ""}): ${c.desc}`,
          )
          .join("\n")
      : "(none yet)";

  const lines = subs.map((s, i) => `${i}\t${s.t}\t${s.text}`).join("\n");
  const system =
    "You segment a children's audio story transcript into visual scenes for a picture book, and track recurring characters. " +
    "Use dense picture-book pacing like episode ep-9 (about 15-20 seconds per scene after the intro). " +
    "Break on every clear plot beat (new place, action, emotion, or story beat)—prefer more scenes rather than fewer. " +
    `Scene 1 may span host banter until the in-story narrative begins (up to ~${INTRO_MAX}s). ` +
    "All later scenes should aim for roughly 15-20 seconds each. " +
    "You are given a KNOWN CHARACTER ROSTER (canonical names + aliases). " +
    "Return JSON {scenes:[{startIndex, summary, prompt, characters}], newCharacters:[{name, aliases, vehicle, desc}]}. " +
    "startIndex = index of the FIRST transcript line of the scene (strictly increasing; first scene MUST be 0). " +
    "summary = short Traditional Chinese phrase. " +
    "prompt = English image prompt: the action and mood of the scene (do NOT restate character appearance; do not ask for text in the image). " +
    "characters = array of CANONICAL names of characters present in that scene; map mis-heard aliases to the roster's canonical name. " +
    "newCharacters = named characters that are NOT already in the roster, each with a canonical Traditional Chinese name, likely aliases, vehicle type, and an English visual appearance description (color, vehicle kind, distinctive features) suitable for keeping it consistent across episodes.";
  const user =
    `Episode title: ${meta.title ?? "(unknown)"}\n` +
    `Protagonist vehicle: ${meta.vehicle ?? "(a friendly car)"}\n` +
    `Audio duration: ${duration}s\n\n` +
    `KNOWN CHARACTER ROSTER:\n${rosterText}\n\n` +
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
  const parsed = SegmentSchema.parse(JSON.parse(content));

  const valid = parsed.scenes
    .filter((s) => s.startIndex < subs.length)
    .sort((a, b) => a.startIndex - b.startIndex);
  if (valid.length === 0) throw new Error("OpenAI 切場景回傳空結果");

  const scenes = buildScenes(
    subs,
    valid.map((s) => s.startIndex),
    duration,
    valid.map((s) => s.summary),
    valid.map((s) => s.prompt),
    valid.map((s) => s.characters),
  );
  return { scenes, newCharacters: parsed.newCharacters };
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
  if (!existsSync(p))
    throw new Error(`找不到場景檔 ${p}；請先跑 npm run illustrate -- ${slug} --segment-only`);
  return JSON.parse(readFileSync(p, "utf8")) as ScenesFile;
}

// ── ② 生圖 ───────────────────────────────────────────────
const TARGET_PX = 1400;

async function toStandardJpeg(buf: Buffer): Promise<Buffer> {
  return sharp(buf).resize(TARGET_PX, TARGET_PX, { fit: "cover" }).jpeg({ quality: 88 }).toBuffer();
}

/** 新角色定裝照：純文字生成（強黏土前綴 + 外觀描述），單一角色正面。 */
export async function generateCharacterPortrait(char: NewCharacter): Promise<Buffer> {
  requireKey();
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();
  const prompt =
    `${CLAY_STYLE_PREFIX}Character model sheet: ${char.desc}. ` +
    `A single ${char.vehicle ?? "vehicle"} character, centered, front three-quarter view, full body, neutral happy pose, plain soft background. ${CLAY_NEGATIVE}`;
  const res = await client.images.generate({
    model: getImageModel(),
    prompt,
    size: "1024x1024",
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("圖像模型未回傳影像（portrait）");
  return toStandardJpeg(Buffer.from(b64, "base64"));
}

/**
 * 生成單幕插圖。refPaths = 該幕出場角色的定裝照（可多張）；空則退回該集封面。
 * descs = 角色外觀描述，接進 prompt 加強一致。
 */
export async function generateSceneImage(
  scene: Scene,
  refPaths: string[],
  descs: string[],
): Promise<Buffer> {
  requireKey();
  const { default: OpenAI, toFile } = await import("openai");
  const client = new OpenAI();

  const charLine =
    descs.length > 0 ? ` Keep these characters exactly on-model: ${descs.join("; ")}.` : "";
  const refPageLine =
    (scene.refPages?.length ?? 0) > 0
      ? " Match the protagonist's open-mouth laugh, mouth shape, pure white teeth, and exact body silhouette (including no arms or hands if the reference has none) exactly from the provided story-panel reference image(s); only change lighting and background as described."
      : "";
  const prompt = `${CLAY_STYLE_PREFIX}Scene: ${scene.prompt}.${refPageLine}${charLine} ${CLAY_NEGATIVE}`;

  const refs = refPaths.filter((p) => existsSync(p));
  if (refs.length > 0) {
    const files = await Promise.all(
      refs.map((p, i) => toFile(readFileSync(p), `ref${i}.jpg`, { type: "image/jpeg" })),
    );
    const res = await client.images.edit({
      model: getImageModel(),
      image: files,
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

/** 把已發佈的頁面圖複製到暫存（供 keepCover 幕使用）。 */
export function copyPublishedPageToStaging(slug: string, index: number): string {
  const src = join(publicDirForSlug(slug), `${pad2(index)}.jpg`);
  if (!existsSync(src)) {
    throw new Error(`keepCover 第 ${index} 幕需要 ${src}，但檔案不存在`);
  }
  const dest = join(stagingDirForSlug(slug), `${pad2(index)}.jpg`);
  mkdirSync(stagingDirForSlug(slug), { recursive: true });
  copyFileSync(src, dest);
  return dest;
}
export function writeStagingPortrait(slug: string, name: string, buf: Buffer): string {
  mkdirSync(stagingDirForSlug(slug), { recursive: true });
  const p = stagingPortraitPath(slug, name);
  writeFileSync(p, buf);
  return p;
}

/**
 * 解析該幕的角色參考圖與描述：
 * - 已在名冊且有定裝照 → 用 public/characters 的圖
 * - 本集新角色（暫存有定裝照）→ 用暫存圖
 * - 都沒有 → 退回該集封面 01.jpg
 */
export function resolveSceneRefs(
  slug: string,
  scene: Scene,
  descByName: Map<string, string>,
): { paths: string[]; descs: string[] } {
  const registry = charByName(readCharacters());
  const paths: string[] = [];
  const descs: string[] = [];
  for (const name of scene.characters ?? []) {
    const reg = registry.get(name);
    if (reg?.ref) {
      const fp = characterRefFsPath(name);
      if (existsSync(fp)) paths.push(fp);
    } else {
      const sp = stagingPortraitPath(slug, name);
      if (existsSync(sp)) paths.push(sp);
    }
    const d = descByName.get(name) ?? reg?.desc;
    if (d) descs.push(`${name}: ${d}`);
  }
  if (paths.length === 0) {
    const cover = join(publicDirForSlug(slug), "01.jpg");
    if (existsSync(cover)) paths.push(cover);
  }
  for (const page of scene.refPages ?? []) {
    const fp = join(publicDirForSlug(slug), `${pad2(page)}.jpg`);
    if (existsSync(fp)) paths.push(fp);
  }
  return { paths, descs };
}

// ── ③ contact sheet ─────────────────────────────────────
export function buildContactSheet(
  slug: string,
  scenes: Scene[],
  newCharacters: NewCharacter[],
): string {
  const dir = stagingDirForSlug(slug);
  mkdirSync(dir, { recursive: true });
  const fmt = (n: number) =>
    `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;

  const charCards = newCharacters
    .map(
      (c) => `
    <figure class="char">
      <img src="./_char-${safeName(c.name)}.jpg" alt="" loading="lazy" />
      <figcaption><b>新角色：${escapeHtml(c.name)}</b><br/>
        <span class="en">${escapeHtml(c.desc)}</span></figcaption>
    </figure>`,
    )
    .join("\n");

  const cards = scenes
    .map(
      (sc) => `
    <figure>
      <img src="./${pad2(sc.index)}.jpg" alt="" loading="lazy" />
      <figcaption>
        <b>#${sc.index}</b> ${fmt(sc.start)}–${fmt(sc.end)}（${Math.round(sc.end - sc.start)}s）
        ${(sc.characters ?? []).length ? `· 👤 ${escapeHtml((sc.characters ?? []).join("、"))}` : ""}<br/>
        <span class="zh">${escapeHtml(sc.summary)}</span><br/>
        <span class="en">${escapeHtml(sc.prompt)}</span>
      </figcaption>
    </figure>`,
    )
    .join("\n");

  const charSection = newCharacters.length
    ? `<h2>🆕 本集新角色（${newCharacters.length}）— 審過將存進名冊當定裝照</h2><div class="grid">${charCards}</div>`
    : "";

  const html = `<!doctype html><meta charset="utf-8" />
<title>${slug} — 插圖審稿</title>
<style>
  body{font-family:system-ui,"PingFang TC",sans-serif;background:#fafafa;margin:24px;color:#222}
  h1{font-size:20px} h2{font-size:16px;margin-top:24px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}
  figure{margin:0;background:#fff;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden}
  figure.char{border-color:#c5b3e6}
  img{width:100%;display:block;aspect-ratio:1/1;object-fit:cover;background:#eee}
  figcaption{padding:8px 10px;font-size:12px;line-height:1.5}
  .zh{font-weight:700} .en{color:#666}
  .note{color:#a00;font-weight:700;margin:6px 0 18px}
</style>
<h1>🎬 ${slug} — 共 ${scenes.length} 幕插圖審稿</h1>
<p class="note">⚠️ 兒童內容：逐幕檢查走樣／不適／文字。壞幕 <code>npm run illustrate -- ${slug} --scene N</code>；新角色定裝照不好 <code>--char 名字</code>；全部 OK <code>--approve</code>。</p>
${charSection}
<h2>🎞️ 場景（${scenes.length}）</h2>
<div class="grid">${cards}</div>
`;
  const p = join(dir, "contact.html");
  writeFileSync(p, html, "utf8");
  return p;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── ③ approve：暫存 → public + 登記角色 + 寫接線 ───────────────
export interface ApproveResult {
  copied: number;
  registered: string[];
  publicDir: string;
  captionTimes: number[];
  wiredVia: "overrides" | "manual-instructions";
}

export function approve(slug: string): ApproveResult {
  const scenesFile = readScenesFile(slug);
  const staging = stagingDirForSlug(slug);
  const scenes = scenesFile.scenes;

  const pub = publicDirForSlug(slug);
  const coverBackup = new Map<number, Buffer>();
  for (const sc of scenes) {
    if (sc.keepCover) {
      const existing = join(pub, `${pad2(sc.index)}.jpg`);
      if (existsSync(existing)) coverBackup.set(sc.index, readFileSync(existing));
    }
  }

  for (const sc of scenes) {
    const img = join(staging, `${pad2(sc.index)}.jpg`);
    if (!existsSync(img) && !sc.keepCover) {
      throw new Error(
        `缺暫存圖 ${img}；請先跑 npm run illustrate -- ${slug}（必要時 --scene ${sc.index}）`,
      );
    }
  }

  // 先登記新角色（定裝照 → public/characters + 名冊）
  const registered = registerCharacters(slug, scenesFile.newCharacters ?? []);

  // 場景圖 → public（清掉舊頁避免殘留）
  mkdirSync(pub, { recursive: true });
  for (const f of readdirSync(pub)) {
    if (/^\d{2}\.jpg$/.test(f)) rmSync(join(pub, f));
  }
  for (const sc of scenes) {
    const dest = join(pub, `${pad2(sc.index)}.jpg`);
    if (sc.keepCover && coverBackup.has(sc.index)) {
      writeFileSync(dest, coverBackup.get(sc.index)!);
    } else {
      copyFileSync(join(staging, `${pad2(sc.index)}.jpg`), dest);
    }
  }

  const captionTimes = scenes.map((s) => s.start);
  const wiredVia = writeWiring(slug, scenes.length, captionTimes);
  return { copied: scenes.length, registered, publicDir: pub, captionTimes, wiredVia };
}

/** 把本集新角色定裝照存進 public/characters 並 upsert 名冊（已存在則略過）。 */
function registerCharacters(slug: string, newCharacters: NewCharacter[]): string[] {
  if (newCharacters.length === 0) return [];
  const chars = readCharacters();
  const existing = charByName(chars);
  const registered: string[] = [];
  mkdirSync(CHARACTERS_DIR, { recursive: true });

  for (const nc of newCharacters) {
    if (existing.has(nc.name)) continue; // 已登記，保留原定裝照
    const portrait = stagingPortraitPath(slug, nc.name);
    if (!existsSync(portrait)) continue; // 沒生定裝照就跳過（可 --char 補）
    copyFileSync(portrait, characterRefFsPath(nc.name));
    chars.push({
      name: nc.name,
      aliases: nc.aliases,
      vehicle: nc.vehicle,
      desc: nc.desc,
      ref: `characters/${safeName(nc.name)}.jpg`,
      firstSeen: slug,
    });
    registered.push(nc.name);
  }
  if (registered.length > 0) writeCharacters(chars);
  return registered;
}

// ── 接線：pageCount / captionTimes ───────────────────────
function materializeIntoSynced(
  slug: string,
  pageCount: number,
  captionTimes: number[],
): boolean {
  if (!existsSync(SYNCED_PATH)) return false;
  const synced = JSON.parse(readFileSync(SYNCED_PATH, "utf8")) as Record<string, unknown>[];
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
