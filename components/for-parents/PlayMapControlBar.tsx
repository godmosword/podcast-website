"use client";

import type { PlayMapControlBarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

export function PlayMapControlBar({
  nearMeActive,
  geoStatus,
  freeOnly,
  indoorOnly,
  onNearMe,
  onToggleFree,
  onToggleIndoor,
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
}: PlayMapControlBarProps) {
  return (
    <div className={styles.controlBar}>
      <section className={styles.intentSection} aria-label="快速意圖與篩選">
        <p className={styles.intentLead}>今天想去哪？</p>
        <div className={styles.controlRow}>
          <div className={styles.intentGrid} role="group" aria-label="意圖快捷">
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={nearMeActive}
              aria-busy={geoStatus === "pending"}
              onClick={onNearMe}
            >
              離我最近
            </button>
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={freeOnly}
              onClick={onToggleFree}
            >
              免費放電
            </button>
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={indoorOnly}
              onClick={onToggleIndoor}
            >
              室內
            </button>
          </div>
          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={filtersOpen}
            aria-controls="play-map-filter-panel"
            aria-label={`篩選，${filterSummaryLabel}`}
            onClick={onToggleFilters}
          >
            篩選
          </button>
        </div>
        {geoStatus === "denied" ? (
          <p className={styles.geoHint} role="status">
            無法定位。可改選縣市，或稍後再開啟定位。
          </p>
        ) : null}
        {geoStatus === "pending" ? (
          <p className={styles.geoHint} role="status">
            正在取得位置…
          </p>
        ) : null}
      </section>

      <div className={styles.filterSummary} aria-live="polite">
        <p className={styles.filterSummaryText}>{filterSummaryLabel}</p>
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

      <form
        id="play-map-filter-panel"
        className={styles.filters}
        aria-label="遊樂地點篩選"
        hidden={!filtersOpen}
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
      </form>
    </div>
  );
}
