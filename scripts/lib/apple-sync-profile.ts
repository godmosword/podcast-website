import type { Story } from "../../data/stories";
import {
  emojiForVehicle,
  readBrowseIndex,
  vehicleMatchRules,
} from "./browse-index";

/** 與官網目前 Apple 新集上架框架一致（單圖 MVP + 首頁/內頁 UI 慣例）。 */
export const APPLE_SYNC_PAGE_COUNT = 1;

/** 每集最多自動標幾個主題 tag（與手動集數一致）。 */
const MAX_INFERRED_TAGS = 3;

/** RSS itunes:keywords → 站內主題 tag（對齊 /topic 教育向分類，略過泛用行銷字）。 */
const KEYWORD_TO_TAG: [RegExp, string][] = [
  [/情緒教育|情緒/, "情緒"],
  [/兒童刷牙|蛀牙|刷牙/, "好習慣"],
  [/守信用|守信/, "守信用"],
  [/接受失敗|不是第一名/, "接受失敗"],
  [/想像力|想像/, "想像力"],
  [/創意/, "創意"],
  [/安全飛行|安全/, "安全"],
  [/合作/, "合作"],
  [/求助|幫忙/, "求助"],
  [/助人|幫助/, "助人"],
  [/冷靜/, "冷靜"],
  [/解決問題|想辦法/, "解決問題"],
  [/勇氣|勇敢/, "勇氣"],
  [/成長|學會/, "成長"],
  [/負責/, "負責"],
];

/** 標題／摘要文字 → 站內主題 tag（關鍵字未涵蓋時的後備）。 */
const TEXT_TO_TAG: [RegExp, string][] = [
  [/冷靜|不慌張|別著急/, "冷靜"],
  [/想辦法|解決問題|換條路/, "解決問題"],
  [/感受|同理|顧及|情緒教育|情緒/, "情緒"],
  [/刷牙|蛀牙|衛生|好習慣/, "好習慣"],
  [/勇敢|鼓起勇氣|大聲又勇敢/, "勇氣"],
  [/合作|分工|夥伴|一起完成/, "合作"],
  [/求助|需要幫忙|開口求助/, "求助"],
  [/守信用|說到做到|守信/, "守信用"],
  [/負責|責任/, "負責"],
  [/接受失敗|不是第一名|沒關係/, "接受失敗"],
  [/安全|遵守規則|規則/, "安全"],
  [/幫助別人|幫助|助人/, "助人"],
  [/創意|發揮創意/, "創意"],
  [/想像力|想像|充滿想像/, "想像力"],
  [/成長|學會|長大/, "成長"],
];

function inferVehicleFromText(
  title: string,
  summary: string | undefined,
  keywords: string[] = [],
): string | null {
  const subtitle = subtitleFromTitle(title);
  const titlePart = title.slice(0, title.indexOf("｜") >= 0 ? title.indexOf("｜") : title.length);
  // 標題／關鍵字優先，避免摘要尾段玩笑（如「救護車、警車傻傻分不清楚」）誤判車種
  const primaryBlob = [titlePart, subtitle, keywords.join(" ")].filter(Boolean).join(" ");
  for (const [pattern, vehicle] of vehicleMatchRules()) {
    if (pattern.test(primaryBlob)) return vehicle;
  }
  const textBlob = [title, subtitle, summary ?? "", keywords.join(" ")]
    .filter(Boolean)
    .join(" ");
  for (const [pattern, vehicle] of vehicleMatchRules()) {
    if (pattern.test(textBlob)) return vehicle;
  }
  return null;
}

function emojiForInferredVehicle(vehicle: string): string {
  return emojiForVehicle(vehicle, readBrowseIndex());
}

function subtitleFromTitle(title: string): string {
  const pipe = title.indexOf("｜");
  if (pipe >= 0) return title.slice(pipe + 1).trim();
  const asciiPipe = title.indexOf("|");
  if (asciiPipe >= 0) return title.slice(asciiPipe + 1).trim();
  return "";
}

function collectTagsFromRules(
  haystack: string,
  rules: [RegExp, string][],
  out: string[],
  seen: Set<string>,
): void {
  for (const [pattern, tag] of rules) {
    if (out.length >= MAX_INFERRED_TAGS) break;
    if (seen.has(tag)) continue;
    if (pattern.test(haystack)) {
      seen.add(tag);
      out.push(tag);
    }
  }
}

/**
 * 從 RSS 關鍵字、標題（含｜副標）與摘要推斷站內主題 tags。
 * 優先序：itunes:keywords → 全文（標題+副標+摘要）。
 */
export function inferThemeTags(
  title: string,
  summary: string | undefined,
  keywords: string[] = [],
): string[] {
  const subtitle = subtitleFromTitle(title);
  const textBlob = [title, subtitle, summary ?? ""].filter(Boolean).join(" ");
  const keywordBlob = keywords.join(" ");
  const out: string[] = [];
  const seen = new Set<string>();

  if (keywordBlob) {
    collectTagsFromRules(keywordBlob, KEYWORD_TO_TAG, out, seen);
  }
  collectTagsFromRules(textBlob, TEXT_TO_TAG, out, seen);

  return out;
}

/** 從 RSS 關鍵字、標題（含｜副標）與摘要推斷車種。 */
export function inferVehicle(
  title: string,
  summary: string | undefined,
  keywords: string[] = [],
): string | null {
  return inferVehicleFromText(title, summary, keywords);
}

/** 依標題推斷車種（僅在仍為預設「其他」且無 slug override 的 vehicle 時）。 */
export function applyVehicleInference(
  story: Story,
  title: string,
  summary: string | undefined,
  keywords: string[] | undefined,
  defaultVehicle: string,
  hasVehicleOverride: boolean,
): Story {
  if (hasVehicleOverride || story.vehicle !== defaultVehicle) {
    return story;
  }
  const inferred = inferVehicleFromText(title, summary, keywords ?? []);
  if (!inferred) return story;
  return {
    ...story,
    vehicle: inferred,
    emoji: emojiForInferredVehicle(inferred),
  };
}

/** 補上缺漏的主題 tags（已有 tags 或 defaults overrides 指定時不覆寫）。 */
export function applyTagInference(
  story: Story,
  title: string,
  summary: string | undefined,
  keywords: string[] | undefined,
  hasTagsOverride: boolean,
): Story {
  if (hasTagsOverride || (story.tags?.length ?? 0) > 0) {
    return story;
  }
  const tags = inferThemeTags(title, summary, keywords ?? []);
  if (tags.length === 0) return story;
  return { ...story, tags };
}
