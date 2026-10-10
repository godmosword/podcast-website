/** 全站線性圖示名稱（D14 Icon API）。 */
export const ICON_NAMES = [
  "play",
  "pause",
  "close",
  "menu",
  "menu-close",
  "chevron-right",
  "chevron-down",
  "arrow-left",
  "arrow-right",
  "check",
  "link",
  "home",
  "settings",
  "volume-on",
  "volume-off",
  "bell",
  "timer",
  "text-size",
  "external",
  // 漢堡抽屜各頁（取代 emoji：每台裝置長相不同、夜間只能降飽和）
  "book",
  "car",
  "ferris-wheel",
  "map",
  "heart",
  "notebook-check",
  "compass",
  "map-pin",
  "notebook",
  "plane",
  "mountain",
  "pencil",
  // 全站其他 emoji（日夜切換、故事頁、宇宙地圖、家長頁）
  "sun",
  "moon",
  "theme-system",
  "chat",
  "star",
  "palette",
  "shield-plus",
  "chevron-up",
  "flag",
  "bar-chart",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** 預設圖示尺寸（px）。 */
export const DEFAULT_ICON_SIZE = 20;

/** IconButton 最小觸控邊長（WCAG／UX-P1-1）。 */
export const ICON_BUTTON_MIN_SIZE_PX = 44;
