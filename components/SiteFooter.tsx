import Link from "next/link";
import ConnectHub from "@/components/ConnectHub";
import styles from "./SiteFooter.module.css";

// 贊助 / 支持連結（選填）。
const SUPPORT_URL = "";

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.parentNote}>
        給家長：每則故事是一組圖片配一段語音，點播放鈕就能邊看邊聽，
        適合睡前親子共讀。
      </p>

      <ConnectHub />

      <div className={styles.bottomBar}>
        <Link href="/about" className={styles.aboutLink}>
          關於我們
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
