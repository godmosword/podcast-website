"use client";

import { useTheme } from "@/components/ThemeProvider";
import { NIGHT_THEME } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  compact?: boolean;
  /** 僅顯示月亮／太陽圖示，用於首頁標語旁 */
  iconOnly?: boolean;
};

export default function ThemeToggle({
  compact = false,
  iconOnly = false,
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === NIGHT_THEME;

  return (
    <button
      type="button"
      className={`${styles.toggle} ${compact ? styles.compact : ""} ${iconOnly ? styles.iconOnly : ""}`}
      onClick={toggleTheme}
      aria-label={isNight ? "切換至日間模式" : "切換至夜晚模式"}
      aria-pressed={isNight}
    >
      <span aria-hidden>{isNight ? "☀️" : "🌙"}</span>
      {!compact && !iconOnly && (
        <span className={styles.label}>{isNight ? "日間模式" : "夜晚模式"}</span>
      )}
    </button>
  );
}
