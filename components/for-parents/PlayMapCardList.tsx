"use client";

import type { Playground } from "@/data/playgrounds";
import {
  estimateDriveMinutes,
  formatDriveMinutesLabel,
  haversineKm,
  type LatLng,
} from "@/lib/playground-distance";
import { PlayMapCard } from "./PlayMapCard";
import type { PlayMapCardListProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";

/**
 * `estimateDriveMinutes` 上限硬夾在 90 分。收錄擴到中彰投雲後，
 * 台北的家長看台中場館會讀到精確的「約 90 分鐘」（實際 2.5 小時以上），
 * 屬對家長的錯誤承諾。觸頂時改為開放式文案；排序仍用真實距離。
 */
const DRIVE_MINUTES_CAP = 90;

function distanceLabelFor(
  place: Playground,
  user: LatLng | null,
): string | null {
  if (!user) return null;
  const minutes = estimateDriveMinutes(
    haversineKm(user, { lat: place.lat, lng: place.lng }),
  );
  if (minutes >= DRIVE_MINUTES_CAP) return `車程 ${DRIVE_MINUTES_CAP} 分以上`;
  return formatDriveMinutesLabel(minutes);
}

export function PlayMapCardList({
  matched,
  unmatched,
  selectedId,
  userLatLng,
  hasExtraFilters,
  onClearFilters,
  onSelect,
  visibleCount,
  canLoadMore,
  visibleCountLabel,
  onLoadMore,
  topRef,
}: PlayMapCardListProps) {
  return (
    <>
      <div ref={topRef} aria-hidden />
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
            /* 命中但超出本批：暫時收起，不從 DOM 移除。 */
            hidden={index >= visibleCount}
            distanceLabel={distanceLabelFor(place, userLatLng)}
            selected={selectedId === place.id}
            onSelect={onSelect}
          />
        ))}
        {unmatched.map((place) => (
          <PlayMapCard
            key={`hidden-${place.id}`}
            place={place}
            /* 未命中篩選：與「超出批次」是不同語意，各自獨立表達。 */
            hidden
            distanceLabel={null}
            selected={false}
            onSelect={onSelect}
          />
        ))}
      </ul>

      {matched.length > 0 ? (
        /* 放在列表容器內，鍵盤使用者從最後一張卡 Tab 得到，不會卡在批次牆後。 */
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
