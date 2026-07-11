/** D13：字幕句級焦點與翻頁對齊的純函式。 */

export type SubtitleCue = { t: number; text: string };

/**
 * 即時字幕定位：回傳 currentTime 當下應顯示的句子索引（最後一個起始秒數 ≤ t 的句子）。
 * times 需遞增；回傳值夾在 [0, max]。
 */
export function activeCueIndex(times: number[], t: number, max: number): number {
  let idx = 0;
  for (let i = 0; i < times.length; i += 1) {
    if (t >= times[i]) idx = i;
    else break;
  }
  return Math.min(idx, Math.max(0, max));
}

export type CaptionWindow = {
  prev: string | null;
  current: string | null;
  next: string | null;
};

/** 前／當前／後一句（邊界為 null）。 */
export function captionWindow(lines: readonly string[], activeIndex: number): CaptionWindow {
  if (lines.length === 0) {
    return { prev: null, current: null, next: null };
  }
  const idx = Math.min(Math.max(0, activeIndex), lines.length - 1);
  return {
    prev: idx > 0 ? lines[idx - 1]! : null,
    current: lines[idx] ?? null,
    next: idx < lines.length - 1 ? lines[idx + 1]! : null,
  };
}

export type CaptionStackMode = "subtitles" | "scene" | "page";

export type CaptionStackState = {
  mode: CaptionStackMode;
  lines: string[];
  activeIndex: number;
};

/**
 * 決定字幕堆疊資料源：即時字幕軌優先；否則翻頁 captions（含 captionTimes 或等分換頁）。
 */
export function resolveCaptionStackState(input: {
  hasSubtitles: boolean;
  subtitles: SubtitleCue[] | undefined;
  subIndex: number;
  sceneCaptions: boolean;
  captions: string[] | undefined;
  page: number;
  total: number;
}): CaptionStackState | null {
  const {
    hasSubtitles,
    subtitles,
    subIndex,
    sceneCaptions,
    captions,
    page,
    total,
  } = input;

  if (hasSubtitles && subtitles?.length) {
    return {
      mode: "subtitles",
      lines: subtitles.map((s) => s.text),
      activeIndex: subIndex,
    };
  }

  if (sceneCaptions && captions?.length) {
    return {
      mode: "scene",
      lines: captions,
      activeIndex: page,
    };
  }

  if (captions?.length && captions.length === total) {
    return {
      mode: "page",
      lines: captions,
      activeIndex: page,
    };
  }

  return null;
}
