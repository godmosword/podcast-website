import Link from "next/link";
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot.png"
        alt="揮手的紅色小卡車"
        className={styles.mascot}
        width={200}
        height={150}
      />
      <h1 className={styles.title}>車車遊樂園</h1>
      <p className={styles.subtitle}>每天一個車車故事，陪孩子長大 🚗</p>
    </header>
  );
}
