import type { Story } from "@/data/content";
import { getSubtitles, type Subtitle } from "@/lib/subtitles";

/** 場景字幕（翻頁摘要） vs 音檔完整逐字稿（subtitles 側車） */
export type TranscriptKind = "scene-captions" | "full-transcript";

/** 故事有翻頁場景字幕（`story.captions`，短句大綱） */
export function hasSceneCaptions(story: Story): boolean {
  return Boolean(story.captions && story.captions.length > 0);
}

function subtitlesForSlug(slug: string): Subtitle[] | null {
  const subs = getSubtitles(slug);
  return subs && subs.length > 0 ? subs : null;
}

/** 有 `data/subtitles/<slug>.json` 且非空 → 可視為完整逐字稿 */
export function hasFullTranscript(storyOrSlug: Story | string): boolean {
  const slug = typeof storyOrSlug === "string" ? storyOrSlug : storyOrSlug.slug;
  return subtitlesForSlug(slug) !== null;
}

/** 可產出 `/story/<slug>/transcript.vtt`（來自 subtitles，非場景 captions） */
export function hasTranscriptVtt(storyOrSlug: Story | string): boolean {
  return hasFullTranscript(storyOrSlug);
}

/** @deprecated 語意同 `hasFullTranscript`（完整逐字稿，非場景字幕） */
export function hasTranscript(story: Story): boolean {
  return hasFullTranscript(story);
}

/** @deprecated 語意同 `hasTranscriptVtt` */
export function hasVtt(story: Story): boolean {
  return hasTranscriptVtt(story);
}

function vttStamp(sec: number): string {
  const ms = Math.max(0, Math.round(sec * 1000));
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const f = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)}.${p(f, 3)}`;
}

/** 下一 cue 結束時間；避免 end <= start（同 timestamp 連續字幕） */
function cueEndTime(subs: Subtitle[], index: number, start: number): number {
  if (index + 1 >= subs.length) {
    return start + 4;
  }
  const nextT = subs[index + 1].t;
  if (nextT > start) {
    return nextT;
  }
  for (let j = index + 2; j < subs.length; j++) {
    const later = subs[j].t;
    if (later > start) {
      return later;
    }
  }
  return start + 0.2;
}

function buildVttFromSubtitles(subs: Subtitle[]): string {
  const cues = subs.map((entry, i) => {
    const start = entry.t;
    const end = cueEndTime(subs, i, start);
    return `${i + 1}\n${vttStamp(start)} --> ${vttStamp(end)}\n${entry.text.trim()}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}

/** 由 subtitles 側車組 WebVTT；無完整逐字稿回 null */
export function buildFullTranscriptVtt(storyOrSlug: Story | string): string | null {
  const slug = typeof storyOrSlug === "string" ? storyOrSlug : storyOrSlug.slug;
  const subs = subtitlesForSlug(slug);
  if (!subs) return null;
  return buildVttFromSubtitles(subs);
}

/** @deprecated 語意同 `buildFullTranscriptVtt` */
export function buildStoryVtt(story: Story): string | null {
  return buildFullTranscriptVtt(story);
}

/** llms-full 單集區塊：依實際資料標「完整逐字稿」或「場景字幕」 */
export function llmsTranscriptBullet(
  story: Story,
  siteUrl: string,
): string | null {
  const pageUrl = `${siteUrl}/story/${story.slug}`;
  if (hasFullTranscript(story)) {
    return `- 完整逐字稿（WebVTT）：${pageUrl}/transcript.vtt`;
  }
  if (hasSceneCaptions(story)) {
    return `- 場景字幕：見 ${pageUrl}「故事大綱」`;
  }
  return null;
}
