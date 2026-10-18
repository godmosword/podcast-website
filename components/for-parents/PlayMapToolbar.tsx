"use client";

import type { PlayMapToolbarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

/**
 * 頁首只放 H1 與一行收錄摘要。原本 H1 旁的 blob／輪子／星芒三個裝飾不帶資訊，
 * 已移除（DESIGN.md「裝飾不搶內容」）；收錄摘要從頁尾小字上移到這裡。
 */
export function PlayMapToolbar({
  compact = false,
  coverageLabel,
}: PlayMapToolbarProps) {
  return (
    <header className={styles.toolbar} data-compact={compact ? "true" : "false"}>
      <h1 className={styles.title}>親子遊樂地圖</h1>
      {compact ? null : <p className={styles.coverage}>{coverageLabel}</p>}
    </header>
  );
}
