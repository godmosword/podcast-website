/**
 * 親子遊樂地圖家長口吻：只陳述已核對欄位，不發明未核對的周邊細節。
 */
import type { Playground } from "@/data/playgrounds";

export type ParentVoiceFields = Pick<
  Playground,
  "tips" | "facilities" | "free" | "indoor"
>;

const CARD_BLURB_MAX = 72;

export type ComposeParentBlurbOptions = {
  /**
   * 是否在 tips 後補「有兒童遊戲場、有步道」這類設施句（預設 true）。
   * 親子遊樂地圖名單卡傳 false：卡片只留兩行，自動拼接的設施句讀起來像機器生成，
   * 設施清單本來就在 `[placeId]` 詳情頁。
   */
  includeFacilities?: boolean;
};

/** 卡片 1～2 句：先講已核對設施，再摘 tips。 */
export function composeParentBlurb(
  place: ParentVoiceFields,
  maxChars = CARD_BLURB_MAX,
  { includeFacilities = true }: ComposeParentBlurbOptions = {},
): string {
  const tip = (place.tips ?? "").replace(/\s+/g, " ").trim();
  const extras = (includeFacilities ? place.facilities : [])
    .filter((item) => item.length > 0 && !tip.includes(item))
    .slice(0, 2)
    .map((item) => `有${item}`);
  const facilityNote = extras.length > 0 ? `${extras.join("、")}。` : "";
  const combined = [tip, facilityNote].filter(Boolean).join(" ").trim();
  if (!combined) {
    if (place.free) return "免費放電，適合帶小孩出門晃一下。";
    return "出發前可先看詳情與官網再決定怎麼排。";
  }
  return clipParentVoice(combined, maxChars);
}

export function clipParentVoice(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const sentences = text.split(/(?<=[。！？])/).filter(Boolean);
  let out = "";
  for (const sentence of sentences) {
    if (out.length + sentence.length > maxChars && out.length > 0) break;
    out += sentence;
  }
  const source = out || text;
  if (source.length <= maxChars) return source;
  return `${source.slice(0, Math.max(1, maxChars - 1))}…`;
}

/** 詳情核對日：資料於 YYYY 年 M 月核對。 */
export function formatVerifiedMonthLabel(iso: string): string {
  const [year, month] = iso.split("-");
  if (!year || !month) return `資料於 ${iso} 核對`;
  return `資料於 ${year} 年 ${Number(month)} 月核對`;
}
