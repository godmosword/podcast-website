import type { CSSProperties, ReactNode } from "react";
import type { PlatformIcon } from "@/lib/platforms";
import type { SocialIcon } from "@/lib/social";

export { BRAND_COLORS } from "@/lib/brand-assets";

/**
 * 只有還沒有官方檔的圖示留在這裡。
 * Spotify、Apple Podcasts、YouTube、Instagram、Threads、Facebook 用 components/brand/OfficialMark。
 */
export const SOCIAL_ICON_PATHS: Partial<Record<SocialIcon, ReactNode>> = {
  email: (
    <path d="M5.7 6.5h12.6c1.12 0 2 .88 2 2v7c0 1.12-.88 2-2 2H5.7c-1.12 0-2-.88-2-2v-7c0-1.12.88-2 2-2zm.22 2.1 5.56 4.16c.31.23.73.23 1.04 0l5.56-4.16H5.92zm12.68 1.6-4.8 3.58a3 3 0 0 1-3.6 0L5.4 10.2v5.04c0 .34.26.6.6.6h12c.34 0 .6-.26.6-.6V10.2zm-5.08 4.1c.34-.35.9-.35 1.24 0l.14.14.14-.14a.87.87 0 0 1 1.24 1.22l-1.38 1.36-1.38-1.36a.87.87 0 0 1 0-1.22z" />
  ),
};

/** KKBOX 沒有免註冊的官方徽章，維持自繪連結標記（不是官方檔）。 */
export const PLATFORM_ICON_PATHS: Partial<Record<PlatformIcon, ReactNode>> = {
  kkbox: (
    <path d="M6 6h3.4l4.3 6V6H17v12h-3.4l-4.3-6v6H6V6zm9.2 0H19v12h-2.6l-3.4-4.9V18h-2.6V6h2.6l3.2 4.6V6z" />
  ),
};

type BrandSvgProps = {
  children: ReactNode;
  className?: string;
  size?: number;
  style?: CSSProperties;
};

export function BrandSvg({
  children,
  className,
  size = 24,
  style,
}: BrandSvgProps) {
  const px = Math.max(size, 21);
  return (
    <svg
      viewBox="0 0 24 24"
      width={px}
      height={px}
      className={className}
      fill="currentColor"
      aria-hidden
      focusable="false"
      style={style}
    >
      {children}
    </svg>
  );
}
