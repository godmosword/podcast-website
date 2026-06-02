import Link from "next/link";
import SocialLinks from "./SocialLinks";
import Cloud from "./decor/Cloud";
import Road from "./decor/Road";
import decor from "./decor/decor.module.css";
import styles from "./SiteHeader.module.css";

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
        <Cloud
          className={`${styles.cloud} ${styles.cloud1} ${decor.drift}`}
          width={84}
        />
        <Cloud
          className={`${styles.cloud} ${styles.cloud2} ${decor.drift}`}
          width={60}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascot.png"
          alt="揮手的紅色小卡車"
          className={styles.mascot}
          width={200}
          height={150}
        />
        <Road className={styles.road} height={34} />
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
