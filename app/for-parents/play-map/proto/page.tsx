import type { Metadata } from "next";
import Link from "next/link";
import PlayMapProtoApp from "@/components/play-map-proto/PlayMapProtoApp";
import styles from "./page.module.css";

/**
 * 內部 prototype，不是 production 遊樂地圖。
 * C1（z=8 交給 grid）已在 Phase 0 書面證偽：SpatialClusterMarker
 * 點擊只 fitBounds，aria-label 是「此區域有 N 個親子景點」，沒有縣市、
 * 也不呼叫 onSelectCity（見 PlayMapLeaflet.tsx SpatialClusterMarker）。
 * Phase 2 只比較 A／B／C2；C2 完成定義含 15/15 縣市入口全入框。
 */
export const metadata: Metadata = {
  title: { absolute: "親子遊樂地圖 prototype（內部）" },
  description: "內部比較用原型，不列入搜尋與 sitemap。",
  robots: { index: false, follow: false },
};

export default function PlayMapProtoPage() {
  return (
    <main className={styles.main}>
      <Link href="/for-parents/play-map" className={styles.back}>
        ← 回親子遊樂地圖
      </Link>
      <h1 className={styles.title}>親子遊樂地圖 prototype</h1>
      <p className={styles.lede}>
        這是內部比較頁，用來決定全國未縮小範圍該用縣市 cluster 還是縣市卡片。不是正式功能。
      </p>
      <p className={styles.note} role="status">
        三個 variant 只在全國層的呈現不同；選定縣市後進入同一畫面。篩選與定位不在 Phase 2。
      </p>
      <PlayMapProtoApp />
    </main>
  );
}
