"use client";

import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./SubscriptionCTA.module.css";

type Props = {
  accent?: string;
};

/** 單集頁主按鈕下方的訂閱轉換區（Spotify／Apple 優先）。 */
export default function SubscriptionCTA({ accent }: Props) {
  const platforms = visiblePlatforms().filter((p) =>
    ["Spotify", "Apple Podcasts"].includes(p.label),
  );
  if (platforms.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label="訂閱收聽完整版">
      <p className={styles.lead}>
        喜歡這集？在平台聽完整版並訂閱，新集會自動出現在你的 Podcast App
      </p>
      <nav className={styles.row}>
        {platforms.map((p) => (
          <a
            key={p.label}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
            aria-label={`在 ${p.label} 訂閱`}
            onClick={() => trackPlatformClick(p.label, "subscription-cta")}
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
          </a>
        ))}
      </nav>
      <a href="/#connect" className={styles.more} style={{ color: accent }}>
        更多收聽平台 →
      </a>
    </section>
  );
}
