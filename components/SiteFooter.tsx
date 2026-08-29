import Link from "next/link";
import ConnectHub from "@/components/ConnectHub";
import { contactHref, isContactExternal } from "@/lib/contact";
import { PARENT_TRUST_TEXT } from "@/components/ParentTrustStrip";
import Doodle from "@/components/decor/Doodle";
import decor from "@/components/decor/decor.module.css";
import styles from "./SiteFooter.module.css";

// 贊助 / 支持連結（選填）。
const SUPPORT_URL = "";

type SiteFooterProps = {
  compact?: boolean;
  /** 首頁：較緊的頁尾間距（遊樂園改走導覽，不再放頁尾入口） */
  layout?: "default" | "home";
  /** 非首頁：頁尾是否顯示收聽平台 */
  showPlatformSubscribe?: boolean;
  /** utm_campaign：單集 slug；傳給 ConnectHub */
  campaign?: string;
  /**
   * 頁尾給家長的一句話。預設是播放器導向的文案；
   * 沒有播放器的工具頁（如親子遊樂地圖）可覆寫，或傳 null 隱藏。
   */
  parentNote?: string | null;
};

const DEFAULT_PARENT_NOTE =
  "給家長：點播放鈕，孩子邊看圖邊聽故事，適合睡前親子共讀。";

export default function SiteFooter({
  compact = false,
  layout = "default",
  showPlatformSubscribe = true,
  campaign,
  parentNote = DEFAULT_PARENT_NOTE,
}: SiteFooterProps) {
  const isHome = layout === "home";
  const showPlatforms = isHome || showPlatformSubscribe;
  const contactLink = contactHref();
  const contactExternal = isContactExternal(contactLink);

  return (
    <footer
      className={`${styles.footer} ${compact ? styles.compact : ""} ${
        isHome ? styles.home : ""
      }`}
    >
      {/* 克制點綴：Footer 最多 2 個極淡塗鴉 */}
      <Doodle
        kind="dots"
        size={26}
        color="var(--c-sky)"
        className={`${decor.doodle}`}
        style={{ right: "10px", top: "12px", opacity: 0.45 }}
      />
      <Doodle
        kind="loop"
        size={28}
        color="var(--c-yellow)"
        className={`${decor.doodle}`}
        style={{ left: "10px", bottom: "8px", opacity: 0.4 }}
      />
      {parentNote ? (
        <p className={styles.parentNote}>{parentNote}</p>
      ) : null}

      <div className={styles.footerConnect}>
        <ConnectHub
          id={showPlatforms ? "connect" : undefined}
          showPlatforms={showPlatforms}
          campaign={campaign}
        />
      </div>

      <div className={styles.bottomBar}>
        <nav className={styles.metaStrip} aria-label="頁尾連結">
          <Link href="/about" className={styles.metaLink}>
            關於我們
          </Link>
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <a
            href={contactLink}
            className={styles.metaLink}
            {...(contactExternal
              ? {
                  target: "_blank",
                  rel: "noopener noreferrer",
                  "aria-label": "聯絡我們（另開視窗）",
                }
              : {})}
          >
            聯絡我們
          </a>
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <Link href="/studio" className={styles.metaLink}>
            節目數據
          </Link>
          <span className={styles.metaSep} aria-hidden>
            ·
          </span>
          <Link href="/legal" className={styles.metaLink}>
            使用條款與免責聲明
          </Link>
        </nav>
        <p className={styles.privacyLine}>{PARENT_TRUST_TEXT}</p>
        <p className={styles.copyright}>© 車車遊樂園™ · Bonbon &amp; 馬米</p>
        <p className={styles.redistribution}>
          「車車遊樂園」「看圖聽故事」為 Bonbon &amp; 馬米之品牌名稱。
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
