"use client";

import {
  FILTER_PANEL_ID,
  type EnvironmentFilter,
  type PlayMapControlBarProps,
} from "./PlayMapContract";
import styles from "./PlayMap.module.css";

const ENVIRONMENT_OPTIONS: readonly { value: EnvironmentFilter; label: string }[] = [
  { value: "all", label: "不限" },
  { value: "indoor", label: "室內" },
  { value: "outdoor", label: "戶外" },
];

/**
 * 「更多條件」面板：情境卡以外、可疊加的條件。
 * 開關鈕在位置列（PlayMapLocationBar），這裡只放面板內容；網址語意不變。
 */
export function PlayMapControlBar({
  indoorOnly,
  outdoorOnly,
  parkingOnly,
  strollerFriendlyOnly,
  onSelectEnvironment,
  onToggleParking,
  onToggleStrollerFriendly,
  filtersOpen,
  typeFilter,
  typeCounts,
  visibleTypeOptions,
  onSelectType,
}: PlayMapControlBarProps) {
  const environment: EnvironmentFilter = indoorOnly
    ? "indoor"
    : outdoorOnly
      ? "outdoor"
      : "all";

  return (
    <form
      id={FILTER_PANEL_ID}
      className={styles.filters}
      aria-label="更多條件"
      hidden={!filtersOpen}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles.facetRow}>
        <span className={styles.facetLabel}>環境</span>
        <div className={styles.chipGroup} role="group" aria-label="室內或戶外">
          {ENVIRONMENT_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={environment === item.value}
              data-environment={item.value}
              onClick={() => onSelectEnvironment(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.facetRow}>
        <span className={styles.facetLabel}>親子條件</span>
        <div className={styles.chipGroup} role="group" aria-label="親子條件">
          <button
            type="button"
            className={`${styles.chip} ${styles.chipCompact}`}
            aria-pressed={parkingOnly}
            onClick={onToggleParking}
          >
            好停車
          </button>
          <button
            type="button"
            className={`${styles.chip} ${styles.chipCompact}`}
            aria-pressed={strollerFriendlyOnly}
            onClick={onToggleStrollerFriendly}
          >
            推車 OK
          </button>
        </div>
      </div>

      <div className={styles.facetRow}>
        <span className={styles.facetLabel}>類型</span>
        <div className={styles.chipScroller} role="group" aria-label="依類型篩選">
          <button
            type="button"
            className={`${styles.chip} ${styles.chipCompact}`}
            aria-pressed={typeFilter === null}
            onClick={() => onSelectType(null)}
          >
            全部
          </button>
          {visibleTypeOptions.map((item) => {
            const count = typeCounts.get(item) ?? 0;
            return (
              <button
                key={item}
                type="button"
                className={`${styles.chip} ${styles.chipCompact}`}
                aria-pressed={typeFilter === item}
                aria-label={`${item}，${count} 個地點`}
                onClick={() => onSelectType(item)}
              >
                {`${item} · ${count}`}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}
