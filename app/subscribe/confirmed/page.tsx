import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  SUBSCRIBE_CONFIRMED_INVALID_LEDE,
  SUBSCRIBE_CONFIRMED_INVALID_TITLE,
  SUBSCRIBE_CONFIRMED_OK_LEDE,
  SUBSCRIBE_CONFIRMED_OK_TITLE,
} from "@/lib/subscribe-copy";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "確認訂閱結果",
  robots: { index: false, follow: false },
};

export default async function SubscribeConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const ok = status === "ok";

  return (
    <main className={styles.main}>
      <SiteHeader />
      <header className={styles.header}>
        <p className={styles.eyebrow}>給家長</p>
        <h1 className={styles.title}>
          {ok ? SUBSCRIBE_CONFIRMED_OK_TITLE : SUBSCRIBE_CONFIRMED_INVALID_TITLE}
        </h1>
        <p className={styles.lede}>
          {ok
            ? SUBSCRIBE_CONFIRMED_OK_LEDE
            : SUBSCRIBE_CONFIRMED_INVALID_LEDE}
        </p>
        <p className={styles.lede}>
          <Link href="/subscribe">回到名單頁</Link>
        </p>
      </header>
      <SiteFooter compact />
    </main>
  );
}
