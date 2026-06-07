import { getStudioMetrics } from "@/lib/studio/metrics";
import styles from "./MetricsOverview.module.css";

export default function MetricsOverview() {
  const { updatedAt, platforms } = getStudioMetrics();
  const hasAny = platforms.length > 0;

  return (
    <section className={styles.section} aria-labelledby="studio-metrics-heading">
      <h2 id="studio-metrics-heading" className={styles.heading}>
        數據總覽
      </h2>
      <p className={styles.lead}>
        各平台指標將由 API 自動寫入{" "}
        <code>data/studio-metrics.json</code>。目前可先使用下方後台捷徑查看完整報表。
      </p>
      <div className={styles.panel}>
        {hasAny ? (
          <>
            已載入 {platforms.length} 個平台的快照數據。請展開各平台卡片查看細項。
          </>
        ) : (
          <>
            尚未接上 API，數字欄位顯示為「—」。之後可執行{" "}
            <code>scripts/sync-studio-metrics.ts</code>（規劃中）自動更新。
          </>
        )}
        {updatedAt && (
          <p className={styles.updated}>
            上次更新：{new Date(updatedAt).toLocaleString("zh-TW")}
          </p>
        )}
      </div>
    </section>
  );
}
