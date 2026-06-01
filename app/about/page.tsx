import type { Metadata } from "next";
import Link from "next/link";
import { allVehicles, getStoriesByVehicle } from "@/data/stories";
import SiteFooter from "@/components/SiteFooter";
import StoryCard from "@/components/StoryCard";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "車車遊樂園是 Bonbon & 馬米的親子 podcast 看圖聽故事網站，適合睡前親子共讀。",
};

export default function AboutPage() {
  const vehicles = allVehicles();

  return (
    <main className={styles.main}>
      <Link href="/" className={styles.back}>
        ← 回故事屋
      </Link>

      <h1 className={styles.title}>關於車車遊樂園</h1>

      <section className={styles.section}>
        <h2 className={styles.heading}>這是什麼？</h2>
        <p className={styles.text}>
          《車車遊樂園》是 Bonbon &amp; 馬米的親子 podcast
          官方「看圖聽故事」網站。每集搭配插畫與語音，讓孩子邊看邊聽，適合
          3–8 歲與家長一起的睡前時光。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>怎麼使用？</h2>
        <ol className={styles.list}>
          <li>在首頁選一則車車故事</li>
          <li>點「開始看故事」進入全螢幕播放器</li>
          <li>預設「字幕跟讀」會隨語音自動翻頁；也可關閉後手動滑動</li>
          <li>家長可在播放器底部開啟「家長設定」：睡前定時、播放進度</li>
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>訂閱 Podcast</h2>
        <p className={styles.text}>
          想聽更多集數？歡迎到 Apple Podcasts、SoundOn 訂閱《車車遊樂園》。
        </p>
        <div className={styles.links}>
          <a
            href="https://podcasts.apple.com/us/podcast/id1896610920"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apple Podcasts
          </a>
          <a
            href="https://player.soundon.fm/p/c478dbec-701a-4f1c-8c4a-736c52e7c4f5"
            target="_blank"
            rel="noopener noreferrer"
          >
            SoundOn
          </a>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>依車種探索</h2>
        <ul className={styles.vehicleList}>
          {vehicles.map((v) => (
            <li key={v}>
              <Link href={`/vehicles/${encodeURIComponent(v)}`}>{v}</Link>
              <span className={styles.count}>
                {getStoriesByVehicle(v).length} 則
              </span>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}
