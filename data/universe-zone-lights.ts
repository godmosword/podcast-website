/**
 * 各島夜間窗燈（CSS 點燈）— 零資產的夜間點燈方案。
 *
 * 為什麼存在：五島 `hasNightArt` 目前皆為 false（D4 夜間美術尚未落地），
 * 夜間態只有 `filter: brightness(0.93)`，島看起來只是「變暗」而不是「入夜」。
 * 這裡用資料驅動的 CSS 暖光點補上「島上有人、燈亮著」的訊號。
 *
 * ⚠ 與 D4 的關係：某島 `hasNightArt` 翻 true 後，燈光已烘進夜圖，
 * 該島**必須停止**渲染本層（由 `ZoneIsland` 判定），否則兩層燈疊加會過曝。
 * 因此本檔是過渡方案，不是 D4 的替代品。
 *
 * 座標：tile 相對 UV（0–1，左上原點），比照 §12.1 motionParts 的綁定慣例。
 * 定位參考各島日圖裡的建築／窗戶位置，隨島圖改版需一併校正。
 */
import type { ZoneId } from "@/data/universe-zones";

export type ZoneLight = {
  /** tile 內相對位置（0–1）。 */
  u: number;
  v: number;
  /** 光點直徑，相對 tile 寬的比例（0–1）。 */
  size: number;
  /** 暖光色（固定美術色，不隨主題反轉）。 */
  color: string;
  /** 呼吸動畫相位差（毫秒），避免整島同步閃爍像故障。 */
  delayMs: number;
};

/**
 * 每島 2–3 顆，刻意克制：這是「有人在家」的暗示，不是聖誕燈。
 * 兒童向調性 → 暖黃為主，救援島用一點暖橘呼應警示色，海洋島偏青白。
 */
export const ZONE_LIGHTS: Record<ZoneId, readonly ZoneLight[]> = {
  // 車車樂園：中央設施 + 兩側攤位
  "car-park": [
    { u: 0.5, v: 0.46, size: 0.13, color: "#ffd98a", delayMs: 0 },
    { u: 0.33, v: 0.58, size: 0.09, color: "#ffc96b", delayMs: 900 },
    { u: 0.68, v: 0.56, size: 0.09, color: "#ffd98a", delayMs: 1800 },
  ],
  // 恐龍島：火山口餘燼 + 營地
  dino: [
    { u: 0.52, v: 0.42, size: 0.11, color: "#ffb073", delayMs: 400 },
    { u: 0.36, v: 0.62, size: 0.08, color: "#ffd08a", delayMs: 1500 },
  ],
  // 英雄救援隊：塔燈 + 車庫
  rescue: [
    { u: 0.47, v: 0.44, size: 0.1, color: "#ffcf82", delayMs: 200 },
    { u: 0.62, v: 0.6, size: 0.085, color: "#ffb98f", delayMs: 1300 },
  ],
  // 未來夢想島：偏青白的未來感燈號
  ocean: [
    { u: 0.5, v: 0.48, size: 0.1, color: "#bfe9e4", delayMs: 600 },
    { u: 0.66, v: 0.62, size: 0.075, color: "#d8f0ec", delayMs: 1700 },
  ],
  // 森林小島：樹屋暖燈
  forest: [
    { u: 0.49, v: 0.45, size: 0.095, color: "#ffd98a", delayMs: 300 },
    { u: 0.63, v: 0.61, size: 0.075, color: "#ffe0a6", delayMs: 1400 },
  ],
};

export function getZoneLights(id: ZoneId): readonly ZoneLight[] {
  return ZONE_LIGHTS[id];
}
