import type { PlatformIcon } from "@/lib/platforms";

/**
 * 收聽平台官方品牌資產登記。
 * HARD RULES：lib/BRAND-ASSETS-HARD-RULES.md — 禁止手繪或改色。
 */
export const BRAND_ICON_MIN_PX = 21;

/** 僅供文案／邊框強調；禁止作為平台圖示底色。 */
export const BRAND_COLORS = {
  spotify: "#1DB954",
  applePodcasts: "#872EC4",
  kkbox: "#09CEF6",
  youtube: "#FF0000",
  line: "#06C755",
  facebook: "#1877F2",
  threads: "#000000",
} as const;

export type PlatformMarkSpec = {
  src: string;
  width: number;
  height: number;
  /** 圖示實際顯示高度（px） */
  displayHeight: number;
  background: "white" | "transparent";
  wide?: boolean;
};

export const PLATFORM_MARKS: Record<PlatformIcon, PlatformMarkSpec> = {
  spotify: {
    src: "/brand/spotify-icon-green.png",
    width: 40,
    height: 40,
    displayHeight: 32,
    background: "white",
  },
  apple: {
    src: "/brand/apple-podcasts-listen-badge-zh-hant.svg",
    width: 148,
    height: 36,
    displayHeight: 32,
    background: "transparent",
    wide: true,
  },
  youtube: {
    src: "/brand/youtube-icon.svg",
    width: 46,
    height: 32,
    displayHeight: 28,
    background: "white",
  },
  kkbox: {
    src: "/brand/kkbox-logo.svg",
    width: 72,
    height: 18,
    displayHeight: 16,
    background: "white",
    wide: true,
  },
};

export function getPlatformMark(icon: PlatformIcon): PlatformMarkSpec {
  return PLATFORM_MARKS[icon];
}
