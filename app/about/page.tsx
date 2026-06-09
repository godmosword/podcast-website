import type { Metadata } from "next";
import Link from "next/link";
import { allVehicles, getStoriesByVehicle } from "@/data/stories";
import SiteFooter from "@/components/SiteFooter";
import VehicleClayIcon from "@/components/VehicleClayIcon";
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
          3–7 歲與家長一起的睡前時光，每集約 5–10 分鐘。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>怎麼使用？</h2>
        <ol className={styles.list}>
          <li>在首頁選一則車車故事</li>
          <li>點「開始看故事」進入全螢幕播放器</li>
          <li>預設「字幕」會隨語音自動翻頁；也可關閉後手動滑動</li>
          <li>家長可在播放器底部開啟「家長設定」：睡前定時、播放進度</li>
        </ol>
        <p className={styles.text}>
          想訂閱 podcast 或追蹤社群？請見本頁下方的
          <Link href="/#connect" className={styles.inlineLink}>
            追蹤與訂閱
          </Link>
          。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>用車種找故事</h2>
        <p className={styles.text}>
          點選車種會回到首頁並自動篩選，不必另外記不同頁面。
        </p>
        <ul className={styles.chipList}>
          {vehicles.map((v) => (
            <li key={v}>
              <Link
                href={`/?vehicle=${encodeURIComponent(v)}`}
                className={styles.chip}
              >
                <VehicleClayIcon vehicle={v} size={28} />
                {v}
                <span className={styles.chipCount}>
                  {getStoriesByVehicle(v).length} 則
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </main>
  );
}
