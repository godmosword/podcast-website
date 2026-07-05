// ============================================================
// YouTube 整集影片匯出 — 核心邏輯（場景時間軸 + 原始字幕 ASS）
// ============================================================
// 換圖：data/scenes/<slug>.json；字幕：data/subtitles/<slug>.json（逐句 burn-in）
// ============================================================

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Subtitle } from "./illustrate-core";
import type { ScenesFile } from "./illustrate-core";
import { STORIES_DIR } from "./transcribe-core";

const EXPORT_VIDEO_WIDTH = 1920;
const EXPORT_VIDEO_HEIGHT = 1080;
const DEFAULT_HUNINN_TTF = "/tmp/huninn.ttf";
const HUNINN_FONT_NAME = "jf-openhuninn";

export type SceneClip = {
  index: number;
  imagePath: string;
  start: number;
  end: number;
  duration: number;
};

export type ExportVideoMode = "full-illustrated" | "mvp-single-image";

export type ExportManifest = {
  slug: string;
  title: string;
  audioDuration: number;
  sceneCount: number;
  subtitleCount: number;
  proofreadMarked: boolean;
  mode: ExportVideoMode;
  output: string;
  generatedAt: string;
};

const SCALE_PAD_FILTER =
  `scale=${EXPORT_VIDEO_WIDTH}:${EXPORT_VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,` +
  `pad=${EXPORT_VIDEO_WIDTH}:${EXPORT_VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30`;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** ASS 時間碼 H:MM:SS.cc（centiseconds）。 */
export function assTime(sec: number): string {
  const clamped = Math.max(0, sec);
  const cs = Math.round((clamped % 1) * 100);
  const totalSec = Math.floor(clamped);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** 從字幕側車推估音檔長度（fallback）。 */
export function estimateDurationFromSubtitles(subtitles: Subtitle[]): number {
  if (subtitles.length === 0) return 0;
  return Math.ceil(subtitles[subtitles.length - 1].t + 3);
}

/** 解析音檔總長：scenes.audioDuration → probed → 字幕 fallback。 */
export function resolveAudioDuration(
  scenesFile: ScenesFile | null,
  subtitles: Subtitle[],
  probedDuration: number | null,
): number {
  if (scenesFile?.audioDuration && scenesFile.audioDuration > 0) {
    return scenesFile.audioDuration;
  }
  if (probedDuration !== null && probedDuration > 0) {
    return Math.ceil(probedDuration);
  }
  return estimateDurationFromSubtitles(subtitles);
}

function episodeImagePath(slug: string, pageIndex: number): string {
  return join(STORIES_DIR, slug, `${pad2(pageIndex)}.jpg`);
}

/** 最後一幕補齊至音檔結尾，避免視訊短於音軌。 */
export function normalizeClipDurations(
  clips: SceneClip[],
  audioDuration: number,
): SceneClip[] {
  if (clips.length === 0) return clips;
  const out = clips.map((c) => ({ ...c }));
  const total = out.reduce((sum, c) => sum + c.duration, 0);
  const delta = audioDuration - total;
  if (Math.abs(delta) < 0.05) return out;
  const last = out[out.length - 1];
  last.duration = Math.max(0.1, last.duration + delta);
  last.end = last.start + last.duration;
  return out;
}

/** 場景時間軸：全幕用 scenes；MVP 降級為單張 01.jpg。 */
export function resolveSceneClips(params: {
  slug: string;
  pageCount: number;
  scenesFile: ScenesFile | null;
  audioDuration: number;
}): SceneClip[] {
  const { slug, pageCount, scenesFile, audioDuration } = params;

  if (pageCount > 1 && scenesFile && scenesFile.scenes.length > 0) {
    const clips: SceneClip[] = scenesFile.scenes.map((scene) => ({
      index: scene.index,
      imagePath: episodeImagePath(slug, scene.index),
      start: scene.start,
      end: scene.end,
      duration: Math.max(0.1, scene.end - scene.start),
    }));
    return normalizeClipDurations(clips, audioDuration);
  }

  const cover = episodeImagePath(slug, 1);
  if (!existsSync(cover)) {
    throw new Error(`找不到封面 ${cover}；請確認 public/stories/${slug}/01.jpg 存在`);
  }

  return [
    {
      index: 1,
      imagePath: cover,
      start: 0,
      end: audioDuration,
      duration: audioDuration,
    },
  ];
}

export function exportVideoMode(
  pageCount: number,
  scenesFile: ScenesFile | null,
): ExportVideoMode {
  if (pageCount > 1 && scenesFile && scenesFile.scenes.length > 0) {
    return "full-illustrated";
  }
  return "mvp-single-image";
}

/** 字幕全文 charset（供 pyftsubset）。 */
export function collectSubtitleCharset(subtitles: Subtitle[]): string {
  const chars = new Set<string>();
  for (const seg of subtitles) {
    for (const ch of seg.text) {
      chars.add(ch);
    }
  }
  // 標點與空白，避免缺字
  for (const ch of "，。！？、：；「」『』（）…—") {
    chars.add(ch);
  }
  chars.add(" ");
  return [...chars].sort().join("");
}

/** 原始逐句字幕 → ASS（底部白字 burn-in）。 */
export function subtitlesToAss(
  subtitles: Subtitle[],
  audioDuration: number,
  fontName: string = HUNINN_FONT_NAME,
): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${EXPORT_VIDEO_WIDTH}
PlayResY: ${EXPORT_VIDEO_HEIGHT}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,3,2,2,48,48,72,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines: string[] = [header];
  for (let i = 0; i < subtitles.length; i += 1) {
    const seg = subtitles[i];
    const start = assTime(seg.t);
    const endSec =
      i + 1 < subtitles.length ? subtitles[i + 1].t : audioDuration;
    const end = assTime(endSec);
    const text = seg.text.replace(/\n/g, "\\N");
    lines.push(`Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`);
  }
  return `${lines.join("\n")}\n`;
}

/** ffmpeg ass filter 路徑跳脫（macOS／Linux）。 */
function escapeAssFilterPath(filePath: string): string {
  return filePath
    .replace(/\\/g, "\\\\")
    .replace(/:/g, "\\:")
    .replace(/'/g, "'\\''");
}

export type FfmpegPlan = {
  /** spawn 用參數（不含 ffmpeg 本身） */
  args: string[];
  filterComplex: string;
};

/** 組裝 ffmpeg filter_complex：多圖 concat + ass burn-in。 */
export function buildFfmpegFilterComplex(
  clipCount: number,
  assPath: string,
  fontsDir: string,
): string {
  const parts: string[] = [];
  for (let i = 0; i < clipCount; i += 1) {
    parts.push(`[${i}:v]${SCALE_PAD_FILTER}[v${i}]`);
  }
  const concatInputs = Array.from({ length: clipCount }, (_, i) => `[v${i}]`).join("");
  const assEsc = escapeAssFilterPath(assPath);
  const fontsEsc = escapeAssFilterPath(fontsDir);
  parts.push(`${concatInputs}concat=n=${clipCount}:v=1:a=0[vcat]`);
  parts.push(`[vcat]ass='${assEsc}':fontsdir='${fontsEsc}'[vout]`);
  return parts.join(";");
}

/** 組裝整集匯出 ffmpeg 參數。 */
export function buildFfmpegPlan(params: {
  clips: SceneClip[];
  audioPath: string;
  outputPath: string;
  assPath: string;
  fontsDir: string;
}): FfmpegPlan {
  const { clips, audioPath, outputPath, assPath, fontsDir } = params;
  const filterComplex = buildFfmpegFilterComplex(clips.length, assPath, fontsDir);

  const args: string[] = ["-y"];
  for (const clip of clips) {
    args.push("-loop", "1", "-t", String(clip.duration), "-i", clip.imagePath);
  }
  const audioInputIndex = clips.length;
  args.push("-i", audioPath);
  args.push(
    "-filter_complex",
    filterComplex,
    "-map",
    "[vout]",
    "-map",
    `${audioInputIndex}:a`,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-shortest",
    outputPath,
  );

  return { args, filterComplex };
}

export function huninnTtfPath(): string {
  return process.env.HUNINN_TTF?.trim() || DEFAULT_HUNINN_TTF;
}

export function huninnDownloadHint(): string {
  return (
    "curl -sL https://github.com/justfont/open-huninn-font/releases/download/v2.1/jf-openhuninn-2.1.ttf -o /tmp/huninn.ttf"
  );
}
