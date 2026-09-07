import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import FeedbackForm from "@/components/feedback/FeedbackForm";
import FeedbackWall from "@/components/feedback/FeedbackWall";
import FeedbackWallSkeleton from "@/components/feedback/FeedbackWallSkeleton";
import SiteFooter from "@/components/SiteFooter";
import { getCharacters } from "@/data/characters";
import {
  FEEDBACK_INVITE_CHILD,
  FEEDBACK_PAGE_DESCRIPTION,
  FEEDBACK_PAGE_TITLE,
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

function mamiPortraitSrc(): string {
  const mami = getCharacters().find((character) => character.id === "mami");
  return mami?.ref ? `/${mami.ref}` : "/mascot.png";
}

export default function FeedbackPage() {
  const available = isFeedbackDbConfigured();

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <header className={styles.header}>
        <h1 className={styles.title}>{FEEDBACK_PAGE_TITLE}</h1>
      </header>

      <section className={styles.invite} aria-label="馬米邀請">
        <div className={styles.portraitMat}>
          <Image
            src={mamiPortraitSrc()}
            alt=""
            fill
            sizes="(max-width: 479px) 120px, 160px"
            className={styles.portrait}
            priority
            aria-hidden
          />
        </div>
        <div className={styles.bubble}>
          <span className={styles.bubbleTail} aria-hidden />
          <p className={styles.inviteChild}>{FEEDBACK_INVITE_CHILD}</p>
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
