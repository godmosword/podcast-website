import type { Metadata } from "next";
import SubscribeForm from "@/components/SubscribeForm";
import SubscribePageIntro from "@/components/SubscribePageIntro";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { isSubscribeDbConfigured } from "@/lib/subscribe-db";
import { isSubscribeEmailConfigured } from "@/lib/subscribe-email";
import { SUBSCRIBE_PAGE_DESCRIPTION, SUBSCRIBE_PAGE_TITLE } from "@/lib/subscribe-copy";
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
  // 和 GET /api/subscribe 同一個判斷，當第一畫面用。這頁是靜態產生，值在 build 時決定；
  // SubscribePageIntro 掛載後會向 API 再確認一次。
  const registrationOpen = isSubscribeDbConfigured() && isSubscribeEmailConfigured();

  return (
    <main className={styles.main}>
      <SiteHeader />

      <header className={styles.header}>
        <p className={styles.eyebrow}>給家長</p>
        <SubscribePageIntro
          initialOpen={registrationOpen}
          titleClassName={styles.title}
          ledeClassName={styles.lede}
        />
      </header>

      <section className={styles.formSection} aria-label="新集通知">
        <SubscribeForm source="subscribe_page" />
      </section>

      <SiteFooter compact />
    </main>
  );
}
