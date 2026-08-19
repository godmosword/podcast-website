import type { Metadata } from "next";
import Link from "next/link";
import EngagementMetricsPanel from "@/components/studio/EngagementMetricsPanel";
import PlatformStudioCard from "@/components/studio/PlatformStudioCard";
import { studioPlatforms } from "@/lib/studio/platforms";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "節目數據中心",
  description: "車車遊樂園製作團隊用的各平台後台分析入口。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioPage() {
  const platforms = studioPlatforms();

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>節目數據中心</h1>
      <p className={styles.subtitle}>
        製作團隊專用：集中各平台後台捷徑與此瀏覽器的互動驗收數據。
      </p>

      <EngagementMetricsPanel />

      <section className={styles.section} aria-labelledby="studio-logo-heading">
        <h2 id="studio-logo-heading" className={styles.sectionHeading}>
          角色 Logo
        </h2>
        <p className={styles.sectionLead}>
          32px 可辨識、撞型與家族色塊驗收。資產未進檔時顯示缺件佔位。
        </p>
        <Link href="/studio/logo-audit" className={styles.toolLink}>
          打開 Logo 驗收頁
        </Link>
      </section>

      <section className={styles.section} aria-labelledby="studio-platforms-heading">
        <h2 id="studio-platforms-heading" className={styles.sectionHeading}>
          平台後台捷徑
        </h2>
        <p className={styles.sectionLead}>
          登入各平台後台查看完整報表。Spotify 與 Apple 優先對齊訂閱成長主戰場。
        </p>
        <div className={styles.grid}>
          {platforms.map((platform) => (
            <PlatformStudioCard key={platform.id} platform={platform} />
          ))}
        </div>
      </section>

      <p className={styles.footerNote}>© 車車遊樂園 · 製作後台</p>
    </main>
  );
}
