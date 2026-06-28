import type { Story } from "@/data/content";

export function hasTranscript(story: Story): boolean {
  return Boolean(story.captions && story.captions.length > 0);
}

/** 有逐字 + 對齊時間碼且長度一致，才出得了 VTT */
export function hasVtt(story: Story): boolean {
  return Boolean(
    story.captions?.length &&
      story.captionTimes?.length &&
      story.captions.length === story.captionTimes.length,
  );
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

export function buildStoryVtt(story: Story): string | null {
  if (!hasVtt(story)) return null;
  const caps = story.captions!;
  const times = story.captionTimes!;
  const cues = caps.map((text, i) => {
    const start = times[i];
    const end = i + 1 < times.length ? times[i + 1] : start + 4;
    return `${i + 1}\n${vttStamp(start)} --> ${vttStamp(end)}\n${text.trim()}`;
  });
  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
}
