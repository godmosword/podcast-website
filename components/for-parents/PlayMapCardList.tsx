"use client";

import type { Playground } from "@/data/playgrounds";
import { formatPlaceDistanceLabel, type LatLng } from "@/lib/playground-distance";
import { PlayMapCard } from "./PlayMapCard";
import type { PlayMapCardListProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

function distanceLabelFor(
  place: Playground,
  user: LatLng | null,
): string | null {
  return formatPlaceDistanceLabel(place, user);
}

export function PlayMapCardList({
  matched,
  unmatched,
  selectedId,
  userLatLng,
  hasExtraFilters,
  onClearFilters,
  onSelect,
  onShowOnMap,
  showScopeHint,
  visibleCount,
  canLoadMore,
  visibleCountLabel,
  onLoadMore,
  topRef,
}: PlayMapCardListProps) {
  return (
    <>
      <div ref={topRef} aria-hidden />
      {showScopeHint ? (
        <p className={styles.scopeHint} role="status">
          目前顯示全台收錄。選縣市或點「離我最近」，名單與地圖會更準。
        </p>
      ) : null}
      {matched.length === 0 ? (
        <div className={styles.listEmpty} role="status">
          <p className={styles.listEmptyText}>
            目前沒有符合條件的地點，試試改意圖或放寬篩選。
          </p>
          {hasExtraFilters ? (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={onClearFilters}
            >
              清除條件
            </button>
          ) : null}
        </div>
      ) : null}

      {/*
        命中者依排序輸出；未命中者仍掛 hidden，保留 SSR／索引可發現性。
      */}
      <ul className={styles.cardGrid}>
        {matched.map((place, index) => (
          <PlayMapCard
            key={place.id}
            place={place}
            hidden={index >= visibleCount}
            distanceLabel={distanceLabelFor(place, userLatLng)}
            selected={selectedId === place.id}
            onSelect={onSelect}
            onShowOnMap={onShowOnMap}
          />
        ))}
        {unmatched.map((place) => (
          <PlayMapCard
            key={`hidden-${place.id}`}
            place={place}
            hidden
            distanceLabel={null}
            selected={false}
            onSelect={onSelect}
            onShowOnMap={onShowOnMap}
          />
        ))}
      </ul>

      {matched.length > 0 ? (
        <div className={styles.loadMoreBar}>
          <p className={styles.loadMoreStatus} role="status" aria-live="polite">
            {visibleCountLabel}
          </p>
          {canLoadMore ? (
            <button
              type="button"
              className={styles.loadMore}
              onClick={onLoadMore}
            >
              載入更多
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
