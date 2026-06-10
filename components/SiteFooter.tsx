import Link from "next/link";
import ConnectHub from "@/components/ConnectHub";
import PlaygroundHubBadge from "@/components/games/PlaygroundHubBadge";
import Doodle from "@/components/decor/Doodle";
import decor from "@/components/decor/decor.module.css";
import styles from "./SiteFooter.module.css";

// 贊助 / 支持連結（選填）。
const SUPPORT_URL = "";

type SiteFooterProps = {
  compact?: boolean;
  /** 首頁：遊樂園入口置於頁尾訂閱區上方 */
  layout?: "default" | "home";
  /** 非首頁：頁尾是否顯示收聽平台 */
  showPlatformSubscribe?: boolean;
};

export default function SiteFooter({
  compact = false,
  layout = "default",
  showPlatformSubscribe = true,
}: SiteFooterProps) {
  const isHome = layout === "home";
  const showPlatforms = isHome || showPlatformSubscribe;

  return (
    <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}>
      <Doodle
        kind="squiggle"
        size={36}
        color="var(--c-pink)"
        className={`${decor.doodle} ${decor.tiltA}`}
        style={{ left: "6px", top: "10px" }}
      />
      <Doodle
        kind="dots"
        size={30}
        color="var(--c-sky)"
        className={`${decor.doodle}`}
        style={{ right: "8px", top: "8px" }}
      />
      <Doodle
        kind="burst"
        size={30}
        color="var(--c-mint)"
        className={`${decor.doodle} ${decor.tiltB}`}
        style={{ left: "12%", bottom: "6px" }}
      />
      <Doodle
        kind="loop"
        size={32}
        color="var(--c-yellow)"
        className={`${decor.doodle} ${decor.tiltC}`}
        style={{ right: "12%", bottom: "4px" }}
      />
      <p className={styles.parentNote}>
        給家長：每則故事是一組圖片配一段語音，點播放鈕就能邊看邊聽，
        適合睡前親子共讀。
      </p>

      <div className={styles.footerConnect}>
        {isHome && (
          <Link href="/games" className={`${styles.playgroundLink} press-squash`}>
            <span className={styles.playgroundIcon} aria-hidden>
              <PlaygroundHubBadge size={32} />
            </span>
            <span className={styles.playgroundCopy}>
              <span className={styles.playgroundTitle}>去遊樂園玩</span>
              <span className={styles.playgroundSub}>小遊戲 · 免下載</span>
            </span>
          </Link>
        )}

        <ConnectHub
          id={showPlatforms ? "connect" : undefined}
          showPlatforms={showPlatforms}
        />
      </div>

      <div className={styles.bottomBar}>
        <Link href="/about" className={styles.aboutLink}>
          關於我們
        </Link>
        <Link href="/studio" className={styles.studioLink}>
          節目數據
        </Link>
        <Link href="/legal" className={styles.legalLink}>
          使用條款與免責聲明
        </Link>
        <p className={styles.copyright}>© 車車遊樂園 · Bonbon &amp; 馬米</p>
        <p className={styles.redistribution}>
          節目音訊、插圖與字幕僅供個人收聽；未經書面同意禁止轉載、下載或散布。
        </p>
      </div>

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
    </footer>
  );
}
