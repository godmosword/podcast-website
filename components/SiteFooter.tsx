import Link from "next/link";
import PlatformLinks from "@/components/PlatformLinks";
import SocialLinks from "@/components/SocialLinks";
import styles from "./SiteFooter.module.css";

/** 與首頁 Hero 相同的主視覺（SiteHeader） */
const HERO_IMAGE = "/hero-home.jpg";

// 贊助 / 支持連結（選填）。
const SUPPORT_URL = "";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.parentNote}>
        給家長：每則故事是一組圖片配一段語音，點播放鈕就能邊看邊聽，
        適合睡前親子共讀。
      </p>

      <section className={styles.panel} aria-labelledby="footer-social">
        <h2 id="footer-social" className={styles.panelTitle}>
          <span className={styles.dot} aria-hidden />
          追蹤我們
        </h2>
        <SocialLinks showLabels size="default" />
      </section>

      <PlatformLinks heading="訂閱與收聽" accent="var(--leaf)" />

      <section className={styles.panel} aria-labelledby="footer-site">
        <h2 id="footer-site" className={styles.panelTitle}>
          <span className={styles.dot} aria-hidden />
          更多資訊
        </h2>
        <nav className={styles.siteNav} aria-label="網站導覽">
          <Link href="/about" className={styles.siteCard}>
            <span className={styles.siteIcon} aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMAGE}
                alt=""
                className={styles.siteHeroImage}
                width={64}
                height={64}
              />
            </span>
            <span className={styles.siteText}>
              <span className={styles.siteLabel}>關於我們</span>
              <span className={styles.siteHint}>認識車車遊樂園</span>
            </span>
            <span className={styles.siteArrow} aria-hidden>
              →
            </span>
          </Link>
        </nav>
      </section>

      {SUPPORT_URL.trim() !== "" && (
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.support}
        >
          💛 支持我們繼續說故事
        </a>
      )}

      <p className={styles.copyright}>© 車車遊樂園 · Bonbon &amp; 馬米</p>
    </footer>
  );
}
