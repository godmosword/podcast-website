"use client";

import { useEffect, useState } from "react";
import { getEngagementMetrics } from "@/lib/engagement";
import { subscribeProgress } from "@/lib/progress-store";
import styles from "./EngagementMetricsPanel.module.css";

export default function EngagementMetricsPanel() {
  const [metrics, setMetrics] = useState(() => getEngagementMetrics());

  useEffect(() => {
    const refresh = () => setMetrics(getEngagementMetrics());
    refresh();
    const unsub = subscribeProgress(refresh);
    window.addEventListener("cheche:progress-change", refresh);
    return () => {
      unsub();
      window.removeEventListener("cheche:progress-change", refresh);
    };
  }, []);

  const platformEntries = Object.entries(metrics.platformClicks).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <section
      className={styles.section}
      aria-labelledby="studio-engagement-heading"
    >
      <h2 id="studio-engagement-heading" className={styles.heading}>
        本機互動量測
      </h2>
      <p className={styles.lead}>
        以下數字來自此瀏覽器的 <code>localStorage</code>，供製作團隊在本機驗收完播與轉換行為；非全站統計。
      </p>
      <dl className={styles.grid}>
        <div className={styles.card}>
          <dt>聽完故事集數</dt>
          <dd>{metrics.storiesCompleted.length}</dd>
        </div>
        <div className={styles.card}>
          <dt>看過反思提問</dt>
          <dd>{metrics.reflectionShown.length}</dd>
        </div>
        <div className={styles.card}>
          <dt>平台連結點擊</dt>
          <dd>
            {platformEntries.reduce((sum, [, n]) => sum + n, 0)}
          </dd>
        </div>
      </dl>
      {platformEntries.length > 0 && (
        <details className={styles.details}>
          <summary>平台點擊明細</summary>
          <ul>
            {platformEntries.map(([id, count]) => (
              <li key={id}>
                {id}：{count}
              </li>
            ))}
          </ul>
        </details>
      )}
      {metrics.storiesCompleted.length > 0 && (
        <p className={styles.note}>
          已聽完：{metrics.storiesCompleted.join("、")}
        </p>
      )}
    </section>
  );
}
