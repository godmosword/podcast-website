"use client";

import type { PlatformClickSource } from "@/lib/analytics";
import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { visiblePlatforms } from "@/lib/platforms";
import TrackedPlatformLink from "./TrackedPlatformLink";
import styles from "./PlatformLinks.module.css";

type Props = {
  /** 區塊標題，預設「在這裡收聽」；空字串則不顯示 */
  heading?: string;
  /** 主題色，用於標題前的小圓點裝飾 */
  accent?: string;
  /** 嵌入其他區塊時僅輸出圖示列，不加外框 */
  embedded?: boolean;
  /** Analytics 來源標記 */
  source?: PlatformClickSource;
};

/**
 * 收聽平台圖示列：Apple Podcasts / Spotify / KKBOX / YouTube。
 * 連結來自 lib/platforms.ts。
 */
export default function PlatformLinks({
  heading = "在這裡收聽",
  accent,
  embedded = false,
  source = "story-platforms",
}: Props) {
  const platforms = visiblePlatforms();
  if (platforms.length === 0) return null;

  const row = (
    <nav className={styles.row}>
      {platforms.map((p) => (
          <TrackedPlatformLink
            key={p.label}
            href={p.url}
            label={p.label}
            source={source}
            className={styles.item}
          >
            <span
              className={styles.badge}
              style={{ background: p.color }}
              aria-hidden
            >
              <BrandSvg className={styles.icon}>
                {PLATFORM_ICON_PATHS[p.icon]}
              </BrandSvg>
            </span>
            <span className={styles.label}>{p.label}</span>
          </TrackedPlatformLink>
        ))}
    </nav>
  );

  if (embedded) {
    return row;
  }

  return (
    <section className={styles.wrap} aria-label="收聽平台">
      {heading !== "" && (
        <h2 className={styles.heading}>
          <span
            className={styles.dot}
            style={accent ? { backgroundColor: accent } : undefined}
            aria-hidden
          />
          {heading}
        </h2>
      )}
      {row}
    </section>
  );
}
