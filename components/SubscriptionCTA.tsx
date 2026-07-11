"use client";

import PlatformLinks from "./PlatformLinks";
import styles from "./SubscriptionCTA.module.css";

type Props = {
  accent?: string;
  className?: string;
  /** utm_campaign：單集 slug */
  campaign?: string;
};

/** 單集頁主按鈕下方的收聽／訂閱轉換區（全平台一次列出）。 */
export default function SubscriptionCTA({ accent, className, campaign }: Props) {
  return (
    <section
      className={`${styles.wrap}${className ? ` ${className}` : ""}`}
      aria-label="訂閱收聽完整版"
    >
      <p className={styles.lead}>
        喜歡這集？在平台聽完整版並訂閱，新集會自動出現在你的 Podcast App
      </p>
      <PlatformLinks
        heading=""
        accent={accent}
        embedded
        source="subscription-cta"
        campaign={campaign}
      />
    </section>
  );
}
