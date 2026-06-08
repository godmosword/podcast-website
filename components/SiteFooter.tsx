import Link from "next/link";
import ConnectHub from "@/components/ConnectHub";
import Doodle from "@/components/decor/Doodle";
import decor from "@/components/decor/decor.module.css";
import styles from "./SiteFooter.module.css";

// 贊助 / 支持連結（選填）。
const SUPPORT_URL = "";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
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

      <ConnectHub />

      <div className={styles.bottomBar}>
        <Link href="/games" className={styles.aboutLink}>
          🎮 遊樂園
        </Link>
        <Link href="/games/car-star" className={styles.aboutLink}>
          🚗 車車吃星星
        </Link>
        <Link href="/games/car-mission" className={styles.aboutLink}>
          🚚 溫柔任務
        </Link>
        <Link href="/about" className={styles.aboutLink}>
          關於我們
        </Link>
        <Link href="/studio" className={styles.studioLink}>
          節目數據
        </Link>
        <p className={styles.copyright}>© 車車遊樂園 · Bonbon &amp; 馬米</p>
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
