"use client";

import Doodle from "@/components/decor/Doodle";
import Wheel from "@/components/decor/Wheel";
import type { PlayMapToolbarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

export function PlayMapToolbar({ compact = false }: PlayMapToolbarProps) {
  return (
    <header className={styles.toolbar} data-compact={compact ? "true" : "false"}>
      <div className={styles.titleBlock}>
        <h1 className={styles.title}>親子遊樂地圖</h1>
        {compact ? null : (
          <span className={styles.titleDecor} aria-hidden>
            <Doodle kind="blob" size={28} color="var(--c-mint)" />
            <Wheel size={22} color="var(--c-yellow)" />
            <Doodle kind="burst" size={22} color="var(--c-pink)" />
          </span>
        )}
      </div>
    </header>
  );
}
