// ============================================================
// 轉錄核心（本機 whisper.cpp）— CLI 與 Apple 同步共用
// ============================================================
// ffmpeg → whisper.cpp → 清除幻覺 → 帶時間軸字幕段。
// 隱私：音檔不外送，全程本機。
// ============================================================

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as OpenCC from "opencc-js";

type Subtitle = { t: number; text: string };

// Whisper 中文常輸出簡體；本站為繁中（台灣），統一簡轉繁（含台灣用語）。
const toTraditional = OpenCC.Converter({ from: "cn", to: "twp" });

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const SUBTITLES_DIR = join(ROOT, "data", "subtitles");

const DEFAULT_BIN = process.env.WHISPER_BIN ?? "whisper-cli";
const DEFAULT_MODEL = process.env.WHISPER_MODEL ?? "models/ggml-large-v3.bin";
const DEFAULT_LANG = process.env.WHISPER_LANG ?? "zh";

// Whisper 中文常見幻覺（音樂/靜音段亂加的鳴謝、訂閱呼籲等），整段丟棄。
const HALLUCINATION = [
  /字幕/,
  /amara\.org/i,
  /請不吝/,
  /點贊|點讚/,
  /訂閱.*(轉發|分享|按讚)/,
  /打賞|斗內/,
  /(謝謝|感謝)(大家)?(觀看|收看|聆聽|收聽)/,
  /明鏡|點點欄目/,
  /^[\s\p{P}\p{S}]*$/u, // 純標點/符號/空白
];

function isHallucination(text: string): boolean {
  return HALLUCINATION.some((re) => re.test(text));
}

// 主持人開場白誤聽修正（Whisper 不知道品牌名）。只改固定開場句，
// 不動故事裡真正的「寶寶／媽咪」（如 EP7 彭彭和媽咪）。
// 品牌寫法對齊全站：Bonbon & 馬米。
const NAME_FIXES: [RegExp, string][] = [
  [/我是(寶寶|蹦蹦|崩崩|波波|本本)/g, "我是 Bonbon"],
  [/我是(媽咪|馬明|馬咪|麻咪)/g, "我是馬米"],
];

function fixNames(text: string): string {
  return NAME_FIXES.reduce((s, [re, to]) => s.replace(re, to), text);
}

/** 簡轉繁（台灣用語）+ 修正主持人名 + 清除幻覺、去空白、合併連續重複句。 */
function cleanSegments(segments: Subtitle[]): Subtitle[] {
  const out: Subtitle[] = [];
  for (const seg of segments) {
    const text = fixNames(toTraditional(seg.text.trim()));
    if (!text || isHallucination(text)) continue;
    if (out.length > 0 && out[out.length - 1].text === text) continue;
    out.push({ t: seg.t, text });
  }
  return out;
}

/** 重新本地化既有側車檔（簡轉繁 + 重新過濾），不重跑 Whisper。 */
export function relocalizeSidecar(slug: string): { count: number; file: string } {
  const file = join(SUBTITLES_DIR, `${slug}.json`);
  const segments = JSON.parse(readFileSync(file, "utf-8")) as Subtitle[];
  const cleaned = cleanSegments(segments);
  writeSubtitles(slug, cleaned);
  return { count: cleaned.length, file };
}

export function whisperAvailable(
  bin = DEFAULT_BIN,
  model = DEFAULT_MODEL,
): boolean {
  try {
    execFileSync("which", [bin], { stdio: "ignore" });
    execFileSync("which", ["ffmpeg"], { stdio: "ignore" });
  } catch {
    return false;
  }
  return existsSync(resolve(ROOT, model)) || existsSync(model);
}

type WhisperSeg = { offsets?: { from: number }; text?: string };
type WhisperJson = { transcription?: WhisperSeg[] };

/** 轉錄單一音檔，回傳清理後的字幕段。 */
function transcribeAudio(
  audioPath: string,
  opts: { bin?: string; model?: string; lang?: string } = {},
): Subtitle[] {
  const bin = opts.bin ?? DEFAULT_BIN;
  const model = opts.model ?? DEFAULT_MODEL;
  const lang = opts.lang ?? DEFAULT_LANG;
  const modelPath = existsSync(model) ? model : resolve(ROOT, model);

  const work = mkdtempSync(join(tmpdir(), "transcribe-"));
  const wav = join(work, "audio.wav");
  const outBase = join(work, "out");
  try {
    execFileSync(
      "ffmpeg",
      ["-i", audioPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wav],
      { stdio: "ignore" },
    );
    execFileSync(
      bin,
      ["-m", modelPath, "-f", wav, "-l", lang, "-oj", "-of", outBase],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    const json = JSON.parse(readFileSync(`${outBase}.json`, "utf-8")) as WhisperJson;
    const segments: Subtitle[] = (json.transcription ?? []).map((s) => ({
      t: Math.round(((s.offsets?.from ?? 0) / 1000) * 10) / 10,
      text: (s.text ?? "").trim(),
    }));
    return cleanSegments(segments);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** 寫入 data/subtitles/<slug>.json（即時字幕側車檔）。 */
function writeSubtitles(slug: string, segments: Subtitle[]): string {
  if (!existsSync(SUBTITLES_DIR)) mkdirSync(SUBTITLES_DIR, { recursive: true });
  const file = join(SUBTITLES_DIR, `${slug}.json`);
  writeFileSync(file, `${JSON.stringify(segments)}\n`, "utf-8");
  return file;
}

/** 轉錄音檔並寫側車檔；回傳段數。供 CLI 與同步流程共用。 */
export function transcribeToSidecar(
  slug: string,
  audioPath: string,
  opts: { bin?: string; model?: string; lang?: string } = {},
): { count: number; file: string } {
  const segments = transcribeAudio(audioPath, opts);
  const file = writeSubtitles(slug, segments);
  return { count: segments.length, file };
}
