import type { Metadata } from "next";
import Link from "next/link";
import FeedbackModerationPanel from "@/components/studio/FeedbackModerationPanel";
import { isFeedbackModerationConfigured } from "@/lib/studio-feedback-auth";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "留言審核",
  description: "車車遊樂園製作團隊的留言牆審核後台。",
  robots: {
    index: false,
    follow: false,
  },
};

// 密語狀態與審核資料都隨請求變動：不做靜態化，也不進 sitemap／頂欄／抽屜。
export const dynamic = "force-dynamic";

export default function StudioFeedbackPage() {
  const configured = isFeedbackModerationConfigured();

  return (
    <main className={styles.main}>
      <Link href="/studio" className={styles.back}>
        ← 回節目數據中心
      </Link>

      <h1 className={styles.title}>留言審核</h1>
      <p className={styles.subtitle}>
        先審後發：核准後留言才會出現在公開牆。信箱只在這裡看得到，公開 API 永遠不會回傳。
      </p>

      {configured ? (
        <FeedbackModerationPanel />
      ) : (
        <p className={styles.notice}>
          尚未設定審核密語，審核 API 會回 503。請在部署環境設定{" "}
          <code className={styles.noticeCode}>FEEDBACK_MODERATION_SECRET</code>
          （server-only，不可加 <code className={styles.noticeCode}>NEXT_PUBLIC_</code> 前綴）後重新部署。
        </p>
      )}
    </main>
  );
}
