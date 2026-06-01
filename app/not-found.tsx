import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <main className={styles.main}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot.png"
        alt="揮手的紅色小卡車"
        className={styles.mascot}
        width={160}
        height={120}
      />
      <h1 className={styles.title}>這裡還沒有故事</h1>
      <p className={styles.message}>
        可能是網址打錯了，或這集故事還在準備中。
      </p>
      <Link href="/" className={styles.cta}>
        ← 回故事屋
      </Link>
      <SiteFooter />
    </main>
  );
}
