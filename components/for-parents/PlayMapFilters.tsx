"use client";

import type { PlayMapFiltersProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

export function PlayMapFilters({
  filtersOpen,
  onToggleFilters,
  filterSummaryLabel,
  canClearFilters,
  onClearFilters,
  cities,
  city,
  cityCounts,
  allCityCount,
  onSelectCity,
  cityScrollerRef,
  typeFilter,
  typeCounts,
  visibleTypeOptions,
  onSelectType,
  indoorOnly,
  freeOnly,
  onToggleIndoor,
  onToggleFree,
}: PlayMapFiltersProps) {
  return (
    <div className={styles.filtersSticky}>
      <div className={styles.filterSummary} aria-live="polite">
        <p className={styles.filterSummaryText}>{filterSummaryLabel}</p>
        <button
          type="button"
          className={styles.filterToggle}
          aria-expanded={filtersOpen}
          aria-controls="play-map-city-facet play-map-filter-facets"
          onClick={onToggleFilters}
        >
          篩選
        </button>
        {canClearFilters ? (
          <button
            type="button"
            className={styles.clearFilters}
            onClick={onClearFilters}
          >
            清除條件
          </button>
        ) : null}
      </div>

      {/*
        縣市是最高基數 facet，桌機常駐以維持發現性；手機隨面板收摺。
        同一份 JSX，可見性交給 CSS 依斷點決定（避免手機／桌機兩套 JSX）。
      */}
      <div
        id="play-map-city-facet"
        className={styles.cityFacet}
        data-open={filtersOpen}
      >
        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>縣市</span>
          <div
            ref={cityScrollerRef}
            className={styles.chipScroller}
            role="group"
            aria-label="依縣市篩選"
          >
            <button
              type="button"
              data-city-chip="全部"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={city === null}
              aria-label={`全部，${allCityCount} 個地點`}
              onClick={() => onSelectCity(null)}
            >
              {`全部 · ${allCityCount}`}
            </button>
            {cities.map((item) => {
              const count = cityCounts.get(item) ?? 0;
              return (
                <button
                  key={item}
                  type="button"
                  data-city-chip={item}
                  className={`${styles.chip} ${styles.chipCompact}`}
                  aria-pressed={city === item}
                  aria-label={`${item}，${count} 個地點`}
                  disabled={count === 0 && city !== item}
                  onClick={() => onSelectCity(item)}
                >
                  {`${item} · ${count}`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form
        id="play-map-filter-facets"
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
              const selectedType = typeFilter === item;
              return (
                <button
                  key={item}
                  type="button"
                  className={`${styles.chip} ${styles.chipCompact}`}
                  aria-pressed={selectedType}
                  aria-label={`${item}，${count} 個地點`}
                  onClick={() => onSelectType(item)}
                >
                  {`${item} · ${count}`}
                </button>
              );
            })}
          </div>
        </div>

        {/*
          條件 facet：DESIGN.md 要求「縣市／類型／條件」三個 facet。
          室內／免費是與 type 正交的 boolean，不能塞進類型排（會被讀成互斥）。
          與意圖列共用同一組 state 與 handler，不另存 active 態，避免雙軌不同步。
        */}
        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>條件</span>
          <div
            className={styles.chipGroup}
            role="group"
            aria-label="依條件篩選"
          >
            <button
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={indoorOnly}
              onClick={onToggleIndoor}
            >
              室內
            </button>
            <button
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={freeOnly}
              onClick={onToggleFree}
            >
              免費
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
