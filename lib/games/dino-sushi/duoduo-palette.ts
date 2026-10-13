/**
 * 恐龍車多多的黏土向量色票。
 * 數字與 docs/STYLE-BIBLE.md「多多角色規格」同一套；改一邊要改另一邊。
 * 每種顏色三階：light（左上高光）／base（固有色）／shadow（暗部）。
 */

export const DUODUO_VIEWBOX = { width: 168, height: 132 } as const;

/** 全角色只用這一種暖深描邊，不再混深綠、近黑、橘色線。 */
export const DUODUO_INK = "#4A3C2E";

/** 主輪廓線寬（viewBox 單位）。細節線是它的約一半。 */
export const DUODUO_STROKE = 2.75;
export const DUODUO_DETAIL = 1.5;

/** 白貼紙邊：畫在填色底下的白描邊，露出來的是外圈。 */
export const DUODUO_STICKER = 9;

/** 主光從左上 45° 進來。暗面疊在左下，邊緣光在右上。 */
export const DUODUO_LIGHT = {
  /** 體積漸層中心（objectBoundingBox）。 */
  highlight: { cx: "28%", cy: "26%" },
  /** 半透明暗面：往左下加深。 */
  shade: "#3A2A1C",
  shadeOpacity: 0.26,
  /** 右上邊緣光。 */
  rim: "#FFFFFF",
} as const;

export const DUODUO_PALETTE = {
  ink: DUODUO_INK,
  green: { light: "#B6E878", base: "#5CB83A", shadow: "#3A7A28" },
  muzzle: { light: "#DFF6AE", base: "#8FD14F", shadow: "#6AAA34" },
  spike: { light: "#FFC56A", base: "#F28A2E", shadow: "#C86A16" },
  window: { light: "#D7EEFF", base: "#4A90D9", shadow: "#2C6AAD" },
  wheel: { light: "#6E6862", base: "#2C2A28", shadow: "#161412" },
  hub: { light: "#F7F4EF", base: "#C8C2BA", shadow: "#8A847C" },
  tooth: { light: "#FFFFFF", base: "#FFFEFB", shadow: "#E4DDD2" },
  /** 微張的嘴裡：淡陶土粉，不是牙齦、不是舌頭。 */
  mouth: "#F0C2B4",
  blush: "#FF9FB7",
  metal: { light: "#F3EFE8", base: "#C4BEB4", shadow: "#8A847C" },
} as const;
