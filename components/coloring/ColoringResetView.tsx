"use client";

import { ResetViewIcon } from "./ColoringToolbarIcons";
import styles from "./ColoringResetView.module.css";

type ColoringResetViewProps = {
  onReset: () => void;
};

/**
 * 縮放還原：只在雙指放大後浮在畫布右上角。
 * 平常用不到，不必在家長面板佔一格灰掉的鈕；小孩放大後回不來時也找得到。
 */
export function ColoringResetView({ onReset }: ColoringResetViewProps) {
  return (
    <button
      type="button"
      className={styles.reset}
      aria-label="縮放還原"
      onClick={onReset}
    >
      <ResetViewIcon className={styles.icon} />
    </button>
  );
}
