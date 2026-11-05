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
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as OpenCC from "opencc-js";
import { writeSubtitlesIfChanged, type SubtitleSegment } from "./subtitle-file";

type Subtitle = SubtitleSegment;

// Whisper 中文常輸出簡體；本站為繁中（台灣），統一簡轉繁（含台灣用語）。
const toTraditional = OpenCC.Converter({ from: "cn", to: "twp" });

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SUBTITLES_DIR = join(ROOT, "data", "subtitles");
export const STORIES_DIR = join(ROOT, "public", "stories");

function audioPathForSlug(slug: string): string {
  return join(STORIES_DIR, slug, "audio.mp3");
}

export function subtitleSidecarPath(slug: string): string {
  return join(SUBTITLES_DIR, `${slug}.json`);
}

export function hasSubtitleSidecar(slug: string): boolean {
  return existsSync(subtitleSidecarPath(slug));
}

/** 有音檔但缺 data/subtitles/<slug>.json 的集數（可選限定 slug 清單）。 */
export function listSlugsMissingSubtitles(candidates?: string[]): string[] {
  const slugs =
    candidates ??
    (existsSync(STORIES_DIR)
      ? readdirSync(STORIES_DIR, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
      : []);

  return slugs
    .filter((slug) => existsSync(audioPathForSlug(slug)) && !hasSubtitleSidecar(slug))
    .sort();
}

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

/** 列出已有側車檔的 slug（可選限定候選清單）。 */
export function listSidecarSlugs(candidates?: string[]): string[] {
  const pool =
    candidates ??
    (existsSync(SUBTITLES_DIR)
      ? readdirSync(SUBTITLES_DIR)
          .filter((f) => f.endsWith(".json"))
          .map((f) => f.replace(/\.json$/, ""))
      : []);
  return pool.filter((slug) => hasSubtitleSidecar(slug)).sort();
}

/** 批次重新本地化側車檔（簡轉繁 + 幻覺過濾 + 人名修正），不重跑 Whisper。 */
export function relocalizeSidecars(
  slugs: string[],
): { ok: number; failed: string[] } {
  let ok = 0;
  const failed: string[] = [];
  for (const slug of slugs) {
    if (!hasSubtitleSidecar(slug)) continue;
    try {
      relocalizeSidecar(slug);
      ok += 1;
    } catch {
      failed.push(slug);
    }
  }
  return { ok, failed };
}

function commandAvailable(cmd: string): boolean {
  if (cmd.includes("/")) return existsSync(cmd);
  try {
    execFileSync("which", [cmd], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function whisperAvailable(
  bin = DEFAULT_BIN,
  model = DEFAULT_MODEL,
): boolean {
  if (!commandAvailable(bin) || !commandAvailable("ffmpeg")) return false;
  return existsSync(resolve(ROOT, model)) || existsSync(model);
}

type WhisperSeg = { offsets?: { from: number }; text?: string };
type WhisperJson = { transcription?: WhisperSeg[] };

/**
 * 覆蓋率門檻（秒）。現有字幕：第一句多在 0 秒、最大空白 30、離結尾最多 17、每分鐘至少 15 句。
 * Whisper 遇到片頭音樂可能陷入重複幻覺，被過濾後字幕少一大段甚至全空，但指令照樣成功（ep-36 只剩 42 句）。
 * 第一句 30 秒就算缺：那是 Whisper 整個第一視窗被吃掉（主持人開場不見）。
 */
const COVERAGE_FIRST_MAX = 25;
const COVERAGE_GAP_MAX = 60;
const COVERAGE_TAIL_MAX = 60;
const COVERAGE_MIN_PER_MINUTE = 5;
/** 第一句比這晚就試著補開頭。 */
const OPENING_FILL_AFTER = 15;
/** 第一句比這還晚就不切段了：每段都要重載模型，ep-36 那種 330 秒要 37 段，job 會超時、連失敗都記不到。 */
const OPENING_FILL_MAX = 90;
/** 開頭切成這麼長一段分開轉：段短，幻覺比較沒機會接下去。 */
const OPENING_SLICE_SEC = 9;

/** 字幕有沒有蓋滿整集；有問題回一句原因，沒問題回 null。 */
export function subtitleCoverageProblem(
  cues: readonly Subtitle[],
  durationSec: number,
): string | null {
  if (cues.length === 0) return "沒有字幕";
  const first = cues[0]!.t;
  if (first > COVERAGE_FIRST_MAX) return `第一句在 ${first} 秒才出現`;
  for (let i = 1; i < cues.length; i += 1) {
    const gap = cues[i]!.t - cues[i - 1]!.t;
    if (gap > COVERAGE_GAP_MAX) return `第 ${cues[i - 1]!.t} 秒後有 ${Math.round(gap)} 秒空白`;
  }
  const tail = durationSec - cues[cues.length - 1]!.t;
  if (tail > COVERAGE_TAIL_MAX) return `離結尾還有 ${Math.round(tail)} 秒沒有字幕`;
  const perMinute = cues.length / (durationSec / 60);
  if (perMinute < COVERAGE_MIN_PER_MINUTE) return `句數太少（每分鐘 ${perMinute.toFixed(1)} 句）`;
  return null;
}

/** 開頭補轉：把 [0, firstCue) 切段各轉一次，時間加回原位，只留第一句之前的。 */
function fillOpening(
  cues: readonly Subtitle[],
  runSlice: (start: number, seconds: number) => Subtitle[],
): Subtitle[] {
  const first = cues[0]?.t ?? 0;
  if (first <= OPENING_FILL_AFTER || first > OPENING_FILL_MAX) return [...cues];
  const opening: Subtitle[] = [];
  for (let start = 0; start < first; start += OPENING_SLICE_SEC) {
    for (const cue of runSlice(start, OPENING_SLICE_SEC)) {
      const t = Math.round((start + cue.t) * 10) / 10;
      if (t < first) opening.push({ t, text: cue.text });
    }
  }
  const merged: Subtitle[] = [];
  for (const cue of [...opening, ...cues]) {
    if (merged[merged.length - 1]?.text !== cue.text) merged.push(cue);
  }
  return merged;
}

/**
 * 照常轉一次；覆蓋不足就關掉上下文延續（-mc 0，重複幻覺的來源）重跑，開頭還空就切段補。
 * 全部試過還是不足就丟錯：不寫出殘缺字幕，失敗算進 backfill 的重試次數。
 * allowGaps：人確認過音檔真的這樣（例如結尾長音樂），寫出最好的一份。
 */
export function transcribeWithRetries(input: {
  durationSec: number;
  run: (extraArgs: string[]) => Subtitle[];
  runSlice: (start: number, seconds: number) => Subtitle[];
  allowGaps?: boolean;
}): Subtitle[] {
  const { durationSec, run, runSlice, allowGaps = false } = input;
  const first = run([]);
  if (!subtitleCoverageProblem(first, durationSec)) return first;
  const cues = fillOpening(run(["-mc", "0"]), runSlice);
  const problem = subtitleCoverageProblem(cues, durationSec);
  if (problem && !allowGaps) throw new Error(`字幕不完整：${problem}`);
  return cues;
}

type TranscribeOptions = { bin?: string; model?: string; lang?: string; allowGaps?: boolean };

/** 轉錄單一音檔，回傳清理後的字幕段。 */
function transcribeAudio(
  audioPath: string,
  opts: TranscribeOptions = {},
): Subtitle[] {
  const bin = opts.bin ?? DEFAULT_BIN;
  const model = opts.model ?? DEFAULT_MODEL;
  const lang = opts.lang ?? DEFAULT_LANG;
  const modelPath = existsSync(model) ? model : resolve(ROOT, model);

  const work = mkdtempSync(join(tmpdir(), "transcribe-"));
  const wav = join(work, "audio.wav");
  const outBase = join(work, "out");
  const whisper = (input: string, extraArgs: string[]): Subtitle[] => {
    execFileSync(
      bin,
      ["-m", modelPath, "-f", input, "-l", lang, ...extraArgs, "-oj", "-of", outBase],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
    const json = JSON.parse(readFileSync(`${outBase}.json`, "utf-8")) as WhisperJson;
    const segments: Subtitle[] = (json.transcription ?? []).map((s) => ({
      t: Math.round(((s.offsets?.from ?? 0) / 1000) * 10) / 10,
      text: (s.text ?? "").trim(),
    }));
    return cleanSegments(segments);
  };
  try {
    execFileSync(
      "ffmpeg",
      ["-i", audioPath, "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", "-y", wav],
      { stdio: "ignore" },
    );
    return transcribeWithRetries({
      // 16 kHz、單聲道、16 bit：每秒 32000 位元組（減 WAV 檔頭）。
      durationSec: (statSync(wav).size - 44) / 32000,
      allowGaps: opts.allowGaps,
      run: (extraArgs) => whisper(wav, extraArgs),
      runSlice: (start, seconds) => {
        const slice = join(work, "slice.wav");
        execFileSync(
          "ffmpeg",
          ["-i", wav, "-ss", String(start), "-t", String(seconds), "-c", "copy", "-y", slice],
          { stdio: "ignore" },
        );
        return whisper(slice, ["-mc", "0"]);
      },
    });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** 寫入 data/subtitles/<slug>.json（即時字幕側車檔）；內容沒變就不碰。 */
function writeSubtitles(slug: string, segments: Subtitle[]): string {
  if (!existsSync(SUBTITLES_DIR)) mkdirSync(SUBTITLES_DIR, { recursive: true });
  const file = join(SUBTITLES_DIR, `${slug}.json`);
  writeSubtitlesIfChanged(file, segments);
  return file;
}

/** 轉錄音檔並寫側車檔；回傳段數。供 CLI 與同步流程共用。 */
export function transcribeToSidecar(
  slug: string,
  audioPath: string,
  opts: TranscribeOptions = {},
): { count: number; file: string } {
  const segments = transcribeAudio(audioPath, opts);
  const file = writeSubtitles(slug, segments);
  return { count: segments.length, file };
}
