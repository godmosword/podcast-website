"use client";

import Link from "next/link";
import { useEffect } from "react";
import DuduMoment from "@/components/dudu/DuduMoment";
import { reportClientBoundaryError } from "@/lib/sentry-client";
import styles from "@/app/not-found.module.css";

type SegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** 這個區塊出事時要講的話；主詞是孩子看得懂的東西，不是路由名。 */
  message: string;
  /** 回到本區塊入口的連結，避免把人一路踢回首頁。 */
  backHref: string;
  backLabel: string;
  /** Sentry 分類用；對齊 route segment。 */
  scope: string;
};

/**
 * 區塊級錯誤邊界的共用殼。
 *
 * 為什麼不只靠根層 `app/error.tsx`：地圖、遊戲畫布與需要資料庫的後台都可能
 * 單獨壞掉，落到根層會把整頁換成通用 500，使用者連「退回這一區的入口」都做不到。
 * 有了這層，壞掉的只是那個區塊，站台其餘部分與返回動線都還在。
 */
export default function SegmentError({
  error,
  reset,
  message,
  backHref,
  backLabel,
  scope,
}: SegmentErrorProps) {
  useEffect(() => {
    reportClientBoundaryError(error, "segment", scope);
  }, [error, scope]);

  return (
    <main className={styles.main}>
      <DuduMoment variant="inline" emotion="surprised" label="這一區暫時休息中" />
      <h1 className={styles.title}>這一區暫時休息中</h1>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.cta} onClick={() => reset()}>
          再試一次
        </button>
        <Link href={backHref} className={`${styles.cta} ${styles.ctaSecondary}`}>
          {backLabel}
        </Link>
      </div>
    </main>
  );
}
