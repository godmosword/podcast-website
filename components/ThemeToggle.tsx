"use client";

import { useTheme } from "@/components/ThemeProvider";
import {
  LIGHT_THEME,
  NIGHT_THEME,
  SYSTEM_THEME_MODE,
  type ThemeMode,
} from "@/lib/theme";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/data/icons";
import styles from "./ThemeToggle.module.css";

type ThemeToggleProps = {
  compact?: boolean;
  /** 僅顯示圖示，用於首頁標語旁（循環：系統 → 日間 → 夜晚） */
  iconOnly?: boolean;
  /** 純文字短標籤段控（日／夜／系統），不顯示圖示 */
  textOnly?: boolean;
};

const MODE_LABELS: Record<ThemeMode, string> = {
  system: "跟隨系統",
  light: "日間模式",
  night: "夜晚模式",
};

const MODE_SHORT_LABELS: Record<ThemeMode, string> = {
  system: "系統",
  light: "日",
  night: "夜",
};

/** 全站線條圖示（不用 emoji：各裝置長相不同、夜間只能降飽和）。 */
const MODE_ICONS: Record<ThemeMode, IconName> = {
  system: "theme-system",
  light: "sun",
  night: "moon",
};

export default function ThemeToggle({
  compact = false,
  iconOnly = false,
  textOnly = false,
}: ThemeToggleProps) {
  const { mode, theme, setMode, cycleMode } = useTheme();

  if (iconOnly) {
    return (
      <button
        type="button"
        className={`${styles.toggle} ${styles.iconOnly}`}
        onClick={cycleMode}
        aria-label={`目前：${MODE_LABELS[mode]}，點擊切換`}
        aria-pressed={theme === NIGHT_THEME}
      >
        <Icon name={MODE_ICONS[mode]} size={24} className={styles.glyph} />
      </button>
    );
  }

  return (
    <div
      className={`${styles.group} ${compact ? styles.compact : ""} ${textOnly ? styles.groupText : ""}`}
      role="group"
      aria-label="主題模式"
    >
      {([LIGHT_THEME, NIGHT_THEME, SYSTEM_THEME_MODE] as const).map((option) => {
        const active = mode === option;
        return (
          <button
            key={option}
            type="button"
            className={`${styles.segment} ${active ? styles.segmentActive : ""} ${textOnly ? styles.segmentText : ""}`}
            onClick={() => setMode(option)}
            aria-pressed={active}
            aria-label={MODE_LABELS[option]}
          >
            {!textOnly && <Icon name={MODE_ICONS[option]} size={20} className={styles.glyph} />}
            {textOnly ? (
              <span className={styles.label}>{MODE_SHORT_LABELS[option]}</span>
            ) : (
              !compact && (
                <span className={styles.label}>{MODE_LABELS[option]}</span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}
