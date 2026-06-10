"use client";

import { BrandSvg, PLATFORM_ICON_PATHS } from "@/lib/connect-icons";
import { trackPlatformClick } from "@/lib/analytics";
import { visiblePlatforms } from "@/lib/platforms";
import styles from "./HomeSubscribeBand.module.css";

/**
 * 首頁唯一訂閱收聽區（錨點 #connect）。
 * 平台圖示集中於此；頁尾 ConnectHub 僅保留社群，避免重複。
 */
export default function HomeSubscribeBand() {
  const platforms = visiblePlatforms();
  if (platforms.length === 0) return null;

  return (
    <section
      id="connect"
      className={styles.band}
      aria-labelledby="home-subscribe-heading"
    >
      <div className={styles.copy}>
        <h2 id="home-subscribe-heading" className={styles.heading}>
          <span className={styles.dot} aria-hidden />
          訂閱收聽
        </h2>
        <p className={styles.blurb}>
          訂閱後，新集會自動出現在你的 Podcast App
        </p>
      </div>
      <nav className={styles.row} aria-label="收聽平台">
        {platforms.map((p) => (
          <a
            key={p.label}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.item}
            aria-label={`在 ${p.label} 訂閱`}
            onClick={() => trackPlatformClick(p.label, "home-subscribe")}
          >
            <span
              className={styles.badge}
              style={{ backgroundColor: p.color }}
            >
              <BrandSvg className={styles.icon}>
                {PLATFORM_ICON_PATHS[p.icon]}
              </BrandSvg>
            </span>
            <span className={styles.label}>{p.label}</span>
          </a>
        ))}
      </nav>
    </section>
  );
}
