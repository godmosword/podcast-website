import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { ParentDashboard } from "@/components/for-parents/ParentDashboard";
import { ParentGate } from "@/components/for-parents/ParentGate";
import Icon from "@/components/ui/Icon";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "家庭儀表板",
  description:
    "查看這台裝置上的親子收聽與小遊戲探索摘要：本週時間、故事進度、星星與家長設定。資料只留在您的瀏覽器。",
  alternates: { canonical: "/for-parents/dashboard" },
  openGraph: {
    title: "家庭儀表板 · 車車遊樂園",
    description: "家長視角：本週收聽與遊戲時間、故事進度與快速設定，資料不上傳。",
    url: "/for-parents/dashboard",
    type: "website",
  },
};

export default function ParentDashboardPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>給爸媽</p>
        <h1 className={styles.title}>家庭儀表板</h1>
        <p className={styles.lede}>
          這台裝置上的收聽與小遊戲紀錄。不排名、不打分，資料只留在這個瀏覽器，不上傳。
        </p>
        <nav className={styles.links} aria-label="家庭儀表板相關連結">
          <Link href="/for-parents" className={styles.quietLink}>
            <Icon name="arrow-left" size={16} className="icon-lead" />回到親子指南
          </Link>
          <Link href="/legal#privacy" className={styles.quietLink}>
            隱私說明
          </Link>
        </nav>
      </header>
      <ParentGate>
        <ParentDashboard />
      </ParentGate>
      <SiteFooter compact showPlatformSubscribe={false} />
    </main>
  );
}
