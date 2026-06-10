import type { PlatformIcon } from "@/lib/platforms";

/**
 * 收聽平台官方品牌資產登記。
 * HARD RULES：lib/BRAND-ASSETS-HARD-RULES.md — 禁止手繪或改色。
 */
export const BRAND_ICON_MIN_PX = 21;

/** 全站平台圖示統一外框（PlatformBrandMark）；僅允許在此調整。 */
export const PLATFORM_MARK_TILE = {
  widthPx: 140,
  heightPx: 60,
  imageMaxHeightPx: 36,
} as const;

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
  /** 供 next/image 佈局；顯示尺寸由 PLATFORM_MARK_TILE 統一控制 */
  intrinsicWidth: number;
  intrinsicHeight: number;
  /** 徽章內建文字（如 Apple Listen badge）— 外層不重複顯示 label */
  wide?: boolean;
};

export const PLATFORM_MARKS: Record<PlatformIcon, PlatformMarkSpec> = {
  spotify: {
    src: "/brand/spotify-icon-green.png",
    intrinsicWidth: 939,
    intrinsicHeight: 940,
  },
  apple: {
    src: "/brand/apple-podcasts-listen-badge-zh-hant.svg",
    intrinsicWidth: 165,
    intrinsicHeight: 40,
    wide: true,
  },
  youtube: {
    src: "/brand/youtube-icon.svg",
    intrinsicWidth: 158,
    intrinsicHeight: 110,
  },
  kkbox: {
    src: "/brand/kkbox-logo.svg",
    intrinsicWidth: 786,
    intrinsicHeight: 164,
  },
};

export function getPlatformMark(icon: PlatformIcon): PlatformMarkSpec {
  return PLATFORM_MARKS[icon];
}

export function isPlatformMarkWide(icon: PlatformIcon): boolean {
  return PLATFORM_MARKS[icon].wide === true;
}

/** icon 型顯示外部文字 label；徽章型（wide）僅靠 aria-label。 */
export function shouldShowPlatformLabel(icon: PlatformIcon): boolean {
  return !isPlatformMarkWide(icon);
}
