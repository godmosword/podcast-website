// ============================================================
// 即時字幕載入（建置時讀 data/subtitles/<slug>.json）
// ============================================================
// 字幕由 `npm run transcribe` 或 Apple 同步自動產生，獨立於翻頁。
// 有側車檔的集，播放器以音檔時間顯示字幕；沒有則回退舊邏輯。
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** 一句字幕：t = 起始秒數，text = 內容。 */
export type Subtitle = { t: number; text: string };

export type SubtitleValidationIssue = {
  code: "missing-file" | "invalid-json" | "not-array" | "empty" | "invalid-cue" | "empty-text" | "negative-time" | "non-monotonic-time" | "after-audio";
  index?: number;
  message: string;
};

export type SubtitleValidationOptions = {
  /** 若有 scenes.audioDuration，驗證所有 cue 都落在音檔範圍內。 */
  audioDuration?: number;
};

/** 驗證逐字稿側車的結構、文字與時間軸；不接受靜默丟掉壞 cue。 */
export function validateSubtitleSegments(
  data: unknown,
  options: SubtitleValidationOptions = {},
): SubtitleValidationIssue[] {
  if (!Array.isArray(data)) {
    return [{ code: "not-array", message: "字幕內容必須是陣列" }];
  }
  if (data.length === 0) {
    return [{ code: "empty", message: "字幕陣列不可為空" }];
  }

  const issues: SubtitleValidationIssue[] = [];
  let previousTime: number | undefined;
  for (const [index, cue] of data.entries()) {
    if (
      !cue ||
      typeof cue !== "object" ||
      typeof (cue as Record<string, unknown>).t !== "number" ||
      !Number.isFinite((cue as Record<string, unknown>).t) ||
      typeof (cue as Record<string, unknown>).text !== "string"
    ) {
      issues.push({
        code: "invalid-cue",
        index,
        message: `第 ${index + 1} 句缺少有效的 t／text`,
      });
      continue;
    }

    const t = (cue as Subtitle).t;
    const text = (cue as Subtitle).text;
    if (text.trim().length === 0) {
      issues.push({
        code: "empty-text",
        index,
        message: `第 ${index + 1} 句文字不可為空`,
      });
    }
    if (t < 0) {
      issues.push({
        code: "negative-time",
        index,
        message: `第 ${index + 1} 句時間不可為負數：${t}`,
      });
    }
    if (previousTime !== undefined && t < previousTime) {
      issues.push({
        code: "non-monotonic-time",
        index,
        message: `第 ${index + 1} 句時間 ${t} 早於前一句 ${previousTime}`,
      });
    }
    if (
      options.audioDuration !== undefined &&
      Number.isFinite(options.audioDuration) &&
      t > options.audioDuration
    ) {
      issues.push({
        code: "after-audio",
        index,
        message: `第 ${index + 1} 句時間 ${t} 超過音檔 ${options.audioDuration} 秒`,
      });
    }
    previousTime = t;
  }
  return issues;
}

export type SubtitleFileValidation = {
  ok: boolean;
  subtitles: Subtitle[] | null;
  issues: SubtitleValidationIssue[];
};

/** 驗證某集字幕檔；供頁面載入與 build 後 GEO gate 共用。 */
export function validateSubtitleFile(
  slug: string,
  options: SubtitleValidationOptions = {},
): SubtitleFileValidation {
  const file = join(process.cwd(), "data", "subtitles", `${slug}.json`);
  if (!existsSync(file)) {
    return {
      ok: false,
      subtitles: null,
      issues: [{ code: "missing-file", message: `找不到 data/subtitles/${slug}.json` }],
    };
  }

  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return {
      ok: false,
      subtitles: null,
      issues: [{ code: "invalid-json", message: `無法解析 data/subtitles/${slug}.json` }],
    };
  }

  const issues = validateSubtitleSegments(data, options);
  return {
    ok: issues.length === 0,
    subtitles: issues.length === 0 ? (data as Subtitle[]) : null,
    issues,
  };
}

/** 讀取某集的即時字幕；找不到或格式錯誤回傳 null。 */
export function getSubtitles(slug: string): Subtitle[] | null {
  return validateSubtitleFile(slug).subtitles;
}
