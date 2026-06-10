import styles from "./HomeHeroMobile.module.css";

/** 手機版首屏主視覺：吉祥物徽章 + 手繪風天空場景（不直接使用 hero-home 全圖）。 */
export default function HomeHeroMobile() {
  return (
    <div
      className={styles.emblem}
      role="img"
      aria-label="車車遊樂園吉祥物在藍天與草地前打招呼"
    >
      <div className={styles.sky} aria-hidden>
        <span className={styles.sunOrb} />
        <span className={`${styles.cloud} ${styles.cloudA}`} />
        <span className={`${styles.cloud} ${styles.cloudB}`} />
        <span className={`${styles.cloud} ${styles.cloudC}`} />
        <span className={`${styles.spark} ${styles.sparkA}`} />
        <span className={`${styles.spark} ${styles.sparkB}`} />
      </div>
      <div className={styles.hill} aria-hidden />
      <div className={styles.road} aria-hidden />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mascot.png"
        alt=""
        className={styles.mascot}
        width={480}
        height={360}
        decoding="async"
      />
    </div>
  );
}
