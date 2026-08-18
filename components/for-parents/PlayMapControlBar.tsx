"use client";

import type { PlayMapControlBarProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

export function PlayMapControlBar({
  nearMeActive,
  geoStatus,
  freeOnly,
  indoorOnly,
  outdoorOnly,
  rainyDayOnly,
  parkingOnly,
  strollerFriendlyOnly,
  highEnergyOnly,
  activeFilterCount,
  onNearMe,
  onToggleFree,
  onToggleIndoor,
  onSelectEnvironment,
  onToggleRainyDay,
  onToggleParking,
  onToggleStrollerFriendly,
  onToggleHighEnergy,
  filtersOpen,
  onToggleFilters,
  resultTitle,
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
          <div
            className={styles.intentGrid}
            role="group"
            aria-label="意圖快捷"
          >
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={nearMeActive}
              aria-busy={geoStatus === "pending"}
              data-quick-filter="nearby"
              onClick={onNearMe}
            >
              附近
            </button>
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={rainyDayOnly}
              data-quick-filter="rain"
              onClick={onToggleRainyDay}
            >
              雨天
            </button>
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={freeOnly}
              data-quick-filter="free"
              onClick={onToggleFree}
            >
              免費
            </button>
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={highEnergyOnly}
              data-quick-filter="energy"
              onClick={onToggleHighEnergy}
            >
              放電
            </button>
            <button
              type="button"
              className={styles.intentChip}
              aria-pressed={indoorOnly}
              data-quick-filter="indoor"
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
            aria-label={`篩選條件${activeFilterCount > 0 ? `，已套用 ${activeFilterCount} 個` : ""}，${resultTitle}`}
            onClick={onToggleFilters}
          >
            <span>篩選條件</span>
            {activeFilterCount > 0 ? (
              <span className={styles.filterCount} aria-hidden>
                {activeFilterCount}
              </span>
            ) : null}
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
          </div>
        </div>

        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>環境</span>
          <div
            className={styles.chipGroup}
            role="group"
            aria-label="室內外環境"
          >
            <button
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={!indoorOnly && !outdoorOnly}
              onClick={() => onSelectEnvironment("all")}
            >
              不限
            </button>
            <button
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={indoorOnly}
              onClick={() => onSelectEnvironment("indoor")}
            >
              室內
            </button>
            <button
              type="button"
              className={`${styles.chip} ${styles.chipCompact}`}
              aria-pressed={outdoorOnly}
              onClick={() => onSelectEnvironment("outdoor")}
            >
              戶外
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
