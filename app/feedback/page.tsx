import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackWall from "@/components/feedback/FeedbackWall";
import FeedbackWallSkeleton from "@/components/feedback/FeedbackWallSkeleton";
import SiteFooter from "@/components/SiteFooter";
import {
  FEEDBACK_EYEBROW,
  FEEDBACK_INVITE_CHILD,
  FEEDBACK_INVITE_PARENT,
  FEEDBACK_PAGE_DESCRIPTION,
  FEEDBACK_PAGE_TITLE,
  FEEDBACK_REVIEW_LEAD,
} from "@/lib/feedback-copy";
import { isFeedbackDbConfigured } from "@/lib/feedback-db";
import styles from "./page.module.css";

// 公開牆是投稿內容，審核狀態隨時變；與 GET /api/feedback 一樣不快取。
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: FEEDBACK_PAGE_TITLE,
  description: FEEDBACK_PAGE_DESCRIPTION,
  alternates: { canonical: "/feedback" },
  openGraph: {
    title: `${FEEDBACK_PAGE_TITLE} · 車車遊樂園`,
    description: FEEDBACK_PAGE_DESCRIPTION,
    url: "/feedback",
    type: "website",
  },
};

export default function FeedbackPage() {
  const available = isFeedbackDbConfigured();

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <header className={styles.header}>
        <p className={styles.eyebrow}>{FEEDBACK_EYEBROW}</p>
        <h1 className={styles.title}>{FEEDBACK_PAGE_TITLE}</h1>
      </header>

      <section className={styles.invite} aria-label="馬米邀請">
        {/* eslint-disable-next-line @next/next/no-img-element -- 裝飾小卡，對齊頂欄 mascot */}
        <img
          className={styles.mascot}
          src="/mascot.png"
          alt=""
          width={44}
          height={36}
          aria-hidden
        />
        <div className={styles.inviteBody}>
          <p className={styles.inviteChild}>{FEEDBACK_INVITE_CHILD}</p>
          <p className={styles.inviteParent}>{FEEDBACK_INVITE_PARENT}</p>
          <p className={styles.inviteReview}>{FEEDBACK_REVIEW_LEAD}</p>
        </div>
      </section>

      <section className={styles.formSection} aria-label="留言表單">
        <FeedbackForm available={available} />
      </section>

      <section className={styles.wallSection} aria-label="公開留言牆">
        <Suspense fallback={<FeedbackWallSkeleton />}>
          <FeedbackWall available={available} />
        </Suspense>
      </section>

      <SiteFooter compact />
    </main>
  );
}
