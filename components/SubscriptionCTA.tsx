"use client";

import PlatformLinks from "./PlatformLinks";
import styles from "./SubscriptionCTA.module.css";

type Props = {
  accent?: string;
};

/** 單集頁主按鈕下方的收聽／訂閱轉換區（全平台一次列出）。 */
export default function SubscriptionCTA({ accent }: Props) {
  return (
    <section className={styles.wrap} aria-label="訂閱收聽完整版">
      <p className={styles.lead}>
        喜歡這集？在平台聽完整版並訂閱，新集會自動出現在你的 Podcast App
      </p>
      <PlatformLinks
        heading=""
        accent={accent}
        embedded
        source="subscription-cta"
      />
    </section>
  );
}
