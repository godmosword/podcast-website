"use client";

import { trackPlatformClick } from "@/lib/analytics";
import { shouldShowPlatformLabel } from "@/lib/brand-assets";
import { visiblePlatforms } from "@/lib/platforms";
import PlatformBrandMark from "@/components/PlatformBrandMark";
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
            className={`${styles.item} press-squash`}
            aria-label={`在 ${p.label} 訂閱`}
            onClick={() => trackPlatformClick(p.label, "home-subscribe")}
          >
            <PlatformBrandMark icon={p.icon} label={p.label} />
            {shouldShowPlatformLabel(p.icon) && (
              <span className={styles.label}>{p.label}</span>
            )}
          </a>
        ))}
      </nav>
    </section>
  );
}
