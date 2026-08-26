import type { Metadata } from "next";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { ParentDashboardScreen } from "@/components/for-parents/ParentDashboardScreen";
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
      <ParentDashboardScreen />
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
