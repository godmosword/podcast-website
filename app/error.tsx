"use client";

import { reportClientBoundaryError } from "@/lib/sentry-client";
import Link from "next/link";
import { useEffect } from "react";
import DuduMoment from "@/components/dudu/DuduMoment";
import SiteFooter from "@/components/SiteFooter";
import styles from "./not-found.module.css";

/** 全站 route segment 的 500 fallback；不把 server error 細節暴露給訪客。 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // An error boundary instance is mounted once per error; report that error once.
  useEffect(() => {
    reportClientBoundaryError(error, "route");
  }, [error]);

  return (
    <main className={styles.main}>
      <DuduMoment variant="inline" emotion="surprised" label="頁面暫時休息中" />
      <h1 className={styles.title}>這一頁暫時休息中</h1>
      <p className={styles.message}>
        剛剛遇到一個小狀況，請再試一次，或先回故事屋繼續探索。
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.cta} onClick={() => reset()}>
          再試一次
        </button>
        <Link href="/" className={`${styles.cta} ${styles.ctaSecondary}`}>
          回故事屋
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
