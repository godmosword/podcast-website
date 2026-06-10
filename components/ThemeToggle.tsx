"use client";

import { useTheme } from "@/components/ThemeProvider";
import { NIGHT_THEME } from "@/lib/theme";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  compact?: boolean;
};

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isNight = theme === NIGHT_THEME;

  return (
    <button
      type="button"
      className={`${styles.toggle} ${compact ? styles.compact : ""}`}
      onClick={toggleTheme}
      aria-label={isNight ? "切換至日間模式" : "切換至夜晚模式"}
      aria-pressed={isNight}
    >
      <span aria-hidden>{isNight ? "☀️" : "🌙"}</span>
      {!compact && (
        <span className={styles.label}>{isNight ? "日間模式" : "夜晚模式"}</span>
      )}
    </button>
  );
}
