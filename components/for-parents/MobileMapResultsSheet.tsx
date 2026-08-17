"use client";

import type { Playground } from "@/data/playgrounds";
import {
  formatPlaceDistanceLabel,
  type LatLng,
} from "@/lib/playground-distance";
import { PlayMapCard } from "./PlayMapCard";
import type {
  MobileMapResultsSheetProps,
  MobileMapResultsSnap,
} from "./PlayMapContract";
import styles from "./PlayMap.module.css";

const noop = () => undefined;

function distanceLabelFor(
  place: Playground,
  user: LatLng | null,
): string | null {
  return formatPlaceDistanceLabel(place, user);
}

function sheetClassName(snap: MobileMapResultsSnap): string {
  return [
    styles.resultsSheet,
    snap === "collapsed"
      ? styles.resultsSheetCollapsed
      : snap === "half"
        ? styles.resultsSheetHalf
        : styles.resultsSheetExpanded,
  ].join(" ");
}

export function MobileMapResultsSheet({
  snap,
  panelRef,
  matched,
  selectedId,
  userLatLng,
  nearbyActive,
  viewportSearchActive,
  onClearViewportSearch,
  onSelect,
  onHandleClick,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandlePointerCancel,
}: MobileMapResultsSheetProps) {
  const isExpanded = snap !== "collapsed";
  const handleLabel =
    snap === "collapsed"
      ? "展開景點列表"
      : snap === "half"
        ? "展開更多景點"
        : "收合景點列表";
  const summary =
    matched.length === 0
      ? viewportSearchActive
        ? "這個區域目前沒有符合條件的景點"
        : "目前沒有符合條件的地點"
      : viewportSearchActive
        ? `這個區域有 ${matched.length} 個地方`
        : `${matched.length} 個適合親子出遊的地方`;

  return (
    <section
      ref={panelRef}
      className={sheetClassName(snap)}
      data-snap={snap}
      role="region"
      aria-label="地圖結果"
    >
      <header className={styles.resultsSheetHeader}>
        <div className={styles.resultsSheetHeaderTop}>
          <div className={styles.resultsSheetSummary}>
            <p className={styles.resultEyebrow}>
              {nearbyActive ? "附近地點" : "地圖結果"}
            </p>
            <h2 className={styles.resultsSheetTitle}>{summary}</h2>
          </div>
          <div className={styles.resultsSheetHeaderActions}>
            {viewportSearchActive ? (
              <button
                type="button"
                className={`${styles.clearFilters} ${styles.resultsSheetScopeButton}`}
                onClick={onClearViewportSearch}
              >
                看全台
              </button>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          className={styles.resultsSheetHandle}
          aria-label={handleLabel}
          aria-expanded={isExpanded}
          aria-controls="play-map-results-sheet-list"
          onClick={onHandleClick}
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerCancel}
        >
          <span className={styles.resultsSheetGrip} aria-hidden="true" />
        </button>
      </header>

      <div
        id="play-map-results-sheet-list"
        className={styles.resultsSheetScroll}
      >
        {matched.length === 0 ? (
          <div className={styles.resultsSheetEmpty}>
            <p className={styles.listEmptyText}>{summary}，試試放寬篩選。</p>
          </div>
        ) : (
          <ul className={styles.resultsSheetList}>
            {matched.map((place) => (
              <PlayMapCard
                key={place.id}
                place={place}
                variant="mapSheet"
                hidden={false}
                selected={selectedId === place.id}
                hovered={false}
                hoverCorrelationEnabled={false}
                distanceLabel={distanceLabelFor(place, userLatLng)}
                onHover={noop}
                onBlur={noop}
                onSelect={onSelect}
                registerCardRef={noop}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
