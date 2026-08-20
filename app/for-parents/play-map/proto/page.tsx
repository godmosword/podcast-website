import type { Metadata } from "next";
import Link from "next/link";
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
        Phase 1 只建環境。A／B／C2 切換器在 Phase 2 才會出現。
      </p>
      <section className={styles.section} aria-labelledby="proto-gates-heading">
        <h2 id="proto-gates-heading" className={styles.sectionHeading}>
          已鎖定的約束
        </h2>
        <ul className={styles.list}>
          <li>視窗西緣不得小於 120.35（framing 契約，不是可比較指標）。</li>
          <li>C2 完成定義：15／15 縣市入口中心都在首屏內，不必 pan。</li>
          <li>
            C1 不實作：現役 spatial marker 點擊只放大區域，不能選定縣市。
          </li>
        </ul>
      </section>
    </main>
  );
}
