import Link from "next/link";
import SocialLinks from "./SocialLinks";
import styles from "./SiteHeader.module.css";

/** 首頁 Hero 主視覺（車車遊樂園黏土風格場景圖） */
const HERO_IMAGE = "/hero-home.jpg";

type SiteHeaderProps = {
  variant?: "full" | "compact";
};

export default function SiteHeader({ variant = "full" }: SiteHeaderProps) {
  if (variant === "compact") {
    return (
      <header className={`${styles.header} ${styles.compact}`}>
        <Link href="/" className={`${styles.compactRow} ${styles.link}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot.png"
            alt=""
            className={`${styles.mascot} ${styles.mascotCompact}`}
            width={48}
            height={36}
            aria-hidden
          />
          <span className={`${styles.title} ${styles.titleCompact}`}>
            車車遊樂園
          </span>
        </Link>
      </header>
    );
  }

  return (
    <header className={styles.header}>
      <div className={styles.scene}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE}
          alt="車車遊樂園：卡通車車在遊樂園裡開心玩耍的黏土風格插畫"
          className={styles.heroImage}
          width={1024}
          height={1024}
          fetchPriority="high"
          decoding="async"
        />
      </div>

      <div className={styles.titleWrap}>
        <span className={styles.sun} aria-hidden />
        <h1 className={styles.title}>車車遊樂園</h1>
      </div>
      <p className={styles.subtitle}>每天一個車車故事，陪孩子長大 🚗</p>
      <SocialLinks />
    </header>
  );
}
