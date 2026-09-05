import type { Metadata } from "next";
import Link from "next/link";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackWall from "@/components/feedback/FeedbackWall";
import SiteFooter from "@/components/SiteFooter";
import {
  FEEDBACK_EYEBROW,
  FEEDBACK_INVITE_HINT,
  FEEDBACK_INVITE_LINES,
  FEEDBACK_PAGE_DESCRIPTION,
  FEEDBACK_PAGE_TITLE,
} from "@/lib/feedback-copy";
import styles from "./page.module.css";

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
          <div className={styles.inviteLines}>
            {FEEDBACK_INVITE_LINES.map((line) => (
              <p key={line} className={styles.inviteLine}>
                {line}
              </p>
            ))}
          </div>
          <p className={styles.inviteHint}>{FEEDBACK_INVITE_HINT}</p>
        </div>
      </section>

      <section className={styles.formSection} aria-label="留言表單">
        <FeedbackForm />
      </section>

      <section className={styles.wallSection} aria-label="公開留言牆">
        <FeedbackWall />
      </section>

      <SiteFooter compact />
    </main>
  );
}
