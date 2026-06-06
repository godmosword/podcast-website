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

/** 讀取某集的即時字幕；找不到或格式錯誤回傳 null。 */
export function getSubtitles(slug: string): Subtitle[] | null {
  const file = join(process.cwd(), "data", "subtitles", `${slug}.json`);
  if (!existsSync(file)) return null;
  try {
    const data = JSON.parse(readFileSync(file, "utf-8"));
    if (!Array.isArray(data)) return null;
    return data.filter(
      (s): s is Subtitle =>
        typeof s?.t === "number" && typeof s?.text === "string",
    );
  } catch {
    return null;
  }
}
