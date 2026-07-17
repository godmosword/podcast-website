import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
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
        <h1 className={styles.title}>{ok ? "訂閱確認完成" : "確認連結無效"}</h1>
        <p className={styles.lede}>
          {ok
            ? "好了！之後有新故事上線，我們會寄一封通知給你。"
            : "這個連結可能已過期或已使用。你可以重新申請一封確認信。"}
        </p>
        <p className={styles.lede}>
          <Link href="/subscribe">回到訂閱頁</Link>
        </p>
      </header>
      <SiteFooter compact />
    </main>
  );
}
