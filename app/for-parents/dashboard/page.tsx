import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ParentDashboard } from "@/components/for-parents/ParentDashboard";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "家庭儀表板",
  description:
    "查看這台裝置上的親子收聽與小遊戲探索摘要：星星、貼紙、最近故事與家長設定。資料只留在您的瀏覽器。",
  alternates: { canonical: "/for-parents/dashboard" },
  openGraph: {
    title: "家庭儀表板 · 車車遊樂園",
    description: "家長視角：小遊戲探索、最近收聽與快速設定，資料不上傳。",
    url: "/for-parents/dashboard",
    type: "website",
  },
};

export default function ParentDashboardPage() {
  return (
    <main className={styles.main}>
      <SiteHeader />
      <header className={styles.header}>
        <p className={styles.eyebrow}>STEM-P3 家長端</p>
        <h1 className={styles.title}>家庭儀表板</h1>
        <p className={styles.lede}>
          在這台裝置上，看看孩子最近聽了什麼、玩了哪些小遊戲。不做成績排名，只幫家長掌握共讀與探索節奏。
        </p>
        <Link href="/for-parents" className={styles.guideLink}>
          ← 回到家長指南
        </Link>
      </header>
      <ParentDashboard />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
