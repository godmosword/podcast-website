/** 全站線性圖示名稱（D14 Icon API）。 */
export const ICON_NAMES = [
  "play",
  "pause",
  "close",
  "menu",
  "menu-close",
  "chevron-right",
  "settings",
  "volume-on",
  "volume-off",
  "bell",
  "timer",
  "external",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/** 預設圖示尺寸（px）。 */
export const DEFAULT_ICON_SIZE = 20;

/** IconButton 最小觸控邊長（WCAG／UX-P1-1）。 */
export const ICON_BUTTON_MIN_SIZE_PX = 44;
