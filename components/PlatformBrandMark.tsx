import Image from "next/image";
import type { PlatformIcon } from "@/lib/platforms";
import { PLATFORM_MARK_TILE, getPlatformMark } from "@/lib/brand-assets";
import styles from "./PlatformBrandMark.module.css";

type Props = {
  icon: PlatformIcon;
  label: string;
  className?: string;
};

/**
 * 收聽平台官方品牌資產。禁止改為手繪 SVG — 見 lib/BRAND-ASSETS-HARD-RULES.md。
 * 外框尺寸全站統一（PLATFORM_MARK_TILE），資產僅等比縮放置中。
 */
export default function PlatformBrandMark({ icon, className }: Props) {
  const mark = getPlatformMark(icon);
  const wrapClass = [styles.wrap, className].filter(Boolean).join(" ");

  const tileStyle = {
    "--platform-mark-tile-w": `${PLATFORM_MARK_TILE.widthPx}px`,
    "--platform-mark-tile-h": `${PLATFORM_MARK_TILE.heightPx}px`,
    "--platform-mark-image-max-h": mark.wide
      ? `${PLATFORM_MARK_TILE.heightPx - 16}px`
      : `${PLATFORM_MARK_TILE.imageMaxHeightPx}px`,
  } as React.CSSProperties;

  const imageClass = [styles.image, mark.wide ? styles.imageWide : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={wrapClass} style={tileStyle}>
      <Image
        src={mark.src}
        alt=""
        width={mark.intrinsicWidth}
        height={mark.intrinsicHeight}
        className={imageClass}
        aria-hidden
      />
    </span>
  );
}
