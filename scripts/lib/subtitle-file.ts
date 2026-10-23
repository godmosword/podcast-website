/**
 * 字幕側車檔（data/subtitles/<slug>.json）的唯一寫法。
 * 轉錄、同步再本地化、校稿都走這裡：格式只有一種，內容沒變就不寫，
 * 免得同步每輪把縮排改來改去、開出整檔假 diff 的 PR（#257）。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export type SubtitleSegment = { t: number; text: string };

/** 兩格縮排、結尾換行。人工校稿好讀，diff 也只會出現真的改到的句子。 */
export function serializeSubtitles(segments: readonly SubtitleSegment[]): string {
  return `${JSON.stringify(segments, null, 2)}\n`;
}

/** 寫入側車檔；檔案已經一字不差就不碰。回傳是否真的寫了。 */
export function writeSubtitlesIfChanged(
  file: string,
  segments: readonly SubtitleSegment[],
): boolean {
  const next = serializeSubtitles(segments);
  if (existsSync(file) && readFileSync(file, "utf8") === next) return false;
  writeFileSync(file, next, "utf8");
  return true;
}
