import type { Metadata } from "next";
import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "訂閱新集通知",
  description:
    "留下 Email 並完成確認，新集《看圖聽故事》上線時通知家長。僅用於節目更新，不會公開或轉售。",
  alternates: { canonical: "/subscribe" },
  openGraph: {
    title: "訂閱新集通知 · 車車遊樂園",
    description: "新集上線 Email 通知，適合家長掌握更新節奏。",
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
        <h1 className={styles.title}>訂閱新集通知</h1>
        <p className={styles.lede}>
          留下 Email 並完成信箱確認，我們會在新故事上線時通知你。完整收聽仍建議在{" "}
          <Link href="/#connect">Spotify 或 Apple Podcasts</Link> 訂閱節目。
        </p>
      </header>

      <section className={styles.formSection} aria-label="Email 訂閱表單">
        <SubscribeForm source="subscribe_page" />
      </section>

      <SiteFooter compact />
    </main>
  );
}
