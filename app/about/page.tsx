import type { Metadata } from "next";
import Link from "next/link";
import { allVehicles, getStoriesByVehicle } from "@/data/content";
import SiteFooter from "@/components/SiteFooter";
import VehicleClayIcon from "@/components/VehicleClayIcon";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "關於我們",
  description:
    "車車遊樂園是 Bonbon & 馬米的親子 podcast 看圖聽故事網站，適合睡前親子共讀。",
  alternates: { canonical: "/about" },
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
          《車車遊樂園》是 Bonbon &amp; 馬米的親子 podcast「看圖聽故事」網站。
          每集約 5–10 分鐘，插畫配語音讓孩子邊看邊聽，適合 3–7
          歲的睡前時光。從生活出發、加點想像，一起探險、學習、勇敢闖關。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>怎麼使用？</h2>
        <ol className={styles.list}>
          <li>在首頁選一則車車故事</li>
          <li>點「開始看故事」進入全螢幕播放器</li>
          <li>字幕會隨語音自動翻頁，也可改手動滑動</li>
          <li>播放器底部「家長設定」：睡前定時、播放進度</li>
        </ol>
        <p className={styles.text}>
          訂閱與社群連結見本頁下方
          <Link href="/#connect" className={styles.inlineLink}>
            追蹤與訂閱
          </Link>
          。
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>用車種找故事</h2>
        <p className={styles.text}>
          點選車種會前往故事列表並自動篩選。
        </p>
        <ul className={styles.chipList}>
          {vehicles.map((v) => (
            <li key={v}>
              <Link
                href={`/stories?vehicle=${encodeURIComponent(v)}`}
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
