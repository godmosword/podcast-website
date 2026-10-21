"use client";

import type { PlayMapToolbarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

/**
 * 頁首：h1 固定「親子遊樂地圖」（DESIGN.md 契約，放在上面一行小字），
 * 視覺主標是下面的「今天想怎麼玩？」，再一行收錄摘要。H1 旁不放裝飾。
 */
export function PlayMapToolbar({
  compact = false,
  coverageLabel,
}: PlayMapToolbarProps) {
  return (
    <header className={styles.toolbar} data-compact={compact ? "true" : "false"}>
      <h1 className={styles.title}>親子遊樂地圖</h1>
      {compact ? null : (
        <>
          <p className={styles.headline}>今天想怎麼玩？</p>
          <p className={styles.coverage}>{coverageLabel}</p>
        </>
      )}
    </header>
  );
}
