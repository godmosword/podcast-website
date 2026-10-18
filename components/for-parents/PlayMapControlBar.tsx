"use client";

import Icon from "@/components/ui/Icon";
import type { PlayMapControlBarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

type QuickFilter = {
  key: "rain" | "free" | "indoor" | "energy";
  label: string;
  pressed: boolean;
  onToggle: () => void;
};

/**
 * 條件列：只放可疊加的條件（pill，按下加 ✓）。位置（縣市／附近）在
 * LocationPicker，外型是圓角矩形，兩者不混。
 *
 * `data-quick-filter` 的值是 e2e 契約，不得更名；`nearby` 跟著「我附近」搬到 LocationPicker。
 */
export function PlayMapControlBar({
  freeOnly,
  indoorOnly,
  outdoorOnly,
  rainyDayOnly,
  parkingOnly,
  strollerFriendlyOnly,
  highEnergyOnly,
  panelFilterCount,
  onToggleFree,
  onSelectEnvironment,
  onToggleRainyDay,
  onToggleParking,
  onToggleStrollerFriendly,
  onToggleHighEnergy,
  filtersOpen,
  onToggleFilters,
  typeFilter,
  typeCounts,
  visibleTypeOptions,
  onSelectType,
}: PlayMapControlBarProps) {
  const quickFilters: readonly QuickFilter[] = [
    { key: "rain", label: "雨天", pressed: rainyDayOnly, onToggle: onToggleRainyDay },
    { key: "free", label: "免費", pressed: freeOnly, onToggle: onToggleFree },
    {
      key: "indoor",
      label: "室內",
      pressed: indoorOnly,
      // 室內與面板裡的戶外互斥。
      onToggle: () => onSelectEnvironment(indoorOnly ? "all" : "indoor"),
    },
    { key: "energy", label: "放電", pressed: highEnergyOnly, onToggle: onToggleHighEnergy },
  ];

  return (
    <div className={styles.controlBar}>
      <section className={styles.intentSection} aria-label="快速條件與篩選">
        <div className={styles.controlRow}>
          <div className={styles.intentGrid} role="group" aria-label="快速條件">
            {quickFilters.map((item) => (
              <button
                key={item.key}
                type="button"
                className={styles.intentChip}
                aria-pressed={item.pressed}
                data-quick-filter={item.key}
                onClick={item.onToggle}
              >
                {item.pressed ? <Icon name="check" size={14} /> : null}
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={filtersOpen}
            aria-controls="play-map-filter-panel"
            aria-label={`篩選條件${panelFilterCount > 0 ? `，已套用 ${panelFilterCount} 個` : ""}`}
            onClick={onToggleFilters}
          >
            <Icon name="sliders" size={16} />
            <span>篩選</span>
            {panelFilterCount > 0 ? (
              <span className={styles.filterCount} aria-hidden>
                {panelFilterCount}
              </span>
            ) : null}
          </button>
        </div>
      </section>

      <form
        id="play-map-filter-panel"
        className={styles.filters}
        aria-label="遊樂地點篩選"
        hidden={!filtersOpen}
      >
        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>類型</span>
          <div
            className={styles.chipScroller}
            role="group"
            aria-label="依類型篩選"
          >
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

        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>親子條件</span>
          <div
            className={styles.chipGroup}
            role="group"
            aria-label="進階親子條件"
          >
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
            {/* 室內在快捷列；這裡只放戶外，兩者互斥（沿用 onSelectEnvironment）。 */}
            <button
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={outdoorOnly}
              onClick={() => onSelectEnvironment(outdoorOnly ? "all" : "outdoor")}
            >
              戶外
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
