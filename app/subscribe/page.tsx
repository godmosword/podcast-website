import type { Metadata } from "next";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  SUBSCRIBE_PAGE_DESCRIPTION,
  SUBSCRIBE_PAGE_LEDE,
  SUBSCRIBE_PAGE_TITLE,
} from "@/lib/subscribe-copy";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: SUBSCRIBE_PAGE_TITLE,
  description: SUBSCRIBE_PAGE_DESCRIPTION,
  alternates: { canonical: "/subscribe" },
  openGraph: {
    title: `${SUBSCRIBE_PAGE_TITLE} · 車車遊樂園`,
    description: SUBSCRIBE_PAGE_DESCRIPTION,
    url: "/subscribe",
    type: "website",
  },
};

export default function SubscribePage() {
  return (
    <main className={styles.main}>
      <SiteHeader />

      <header className={styles.header}>
        <p className={styles.eyebrow}>給家長</p>
        <h1 className={styles.title}>{SUBSCRIBE_PAGE_TITLE}</h1>
        <p className={styles.lede}>
          {SUBSCRIBE_PAGE_LEDE} 完整收聽請在{" "}
          <Link href="/#connect">Spotify 或 Apple Podcasts</Link> 訂閱節目。
        </p>
      </header>

      <section className={styles.formSection} aria-label="Email 名單表單">
        <SubscribeForm source="subscribe_page" />
      </section>

      <SiteFooter compact />
    </main>
  );
}
