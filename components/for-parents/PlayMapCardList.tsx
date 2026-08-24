"use client";

import DuduSprite from "@/components/dudu/DuduSprite";
import type { Playground } from "@/data/playgrounds";
import { formatPlaceDistanceLabel, type LatLng } from "@/lib/playground-distance";
import { PlayMapCard } from "./PlayMapCard";
import { PlayMapEditorialPick } from "./PlayMapEditorialPick";
import { OPEN_MAP_BUTTON_ID, type PlayMapCardListProps } from "./PlayMapContract";
import styles from "./PlayMap.module.css";
import results from "./PlayMapResults.module.css";

function distanceLabelFor(
  place: Playground,
  user: LatLng | null,
): string | null {
  return formatPlaceDistanceLabel(place, user);
}

export function PlayMapCardList({
  groups,
  matchedCount,
  unmatched,
  selectedId,
  hoveredPlaceId,
  hoverCorrelationEnabled,
  userLatLng,
  hasExtraFilters,
  onClearFilters,
  viewportSearchActive,
  onClearViewportSearch,
  onHover,
  onBlur,
  onSelect,
  registerCardRef,
  resultSentence,
  groupNote,
  showMapAction,
  onOpenMap,
  coverageLabel,
  editorialPick,
  visibleCount,
  canLoadMore,
  visibleCountLabel,
  onLoadMore,
  topRef,
}: PlayMapCardListProps) {
  return (
    <>
      <div ref={topRef} className={styles.cardListTop} aria-hidden />
      <div className={styles.resultHeader}>
        {/*
          視覺上拆成「在 X 找 Y」＋放大的結果數；讀屏要讀成一句完整的話，
          所以 accessible name 由 srText 提供。
        */}
        <h2 className={results.sentence} aria-label={resultSentence.srText}>
          <span className={results.sentenceLead} aria-hidden>
            在 <b className={results.sentenceScope}>{resultSentence.scopeLabel}</b>
            {resultSentence.facetLabels.length > 0 ? (
              <>
                {" 找 "}
                <b className={results.sentenceFacet}>
                  {resultSentence.facetLabels.join("・")}
                </b>
              </>
            ) : null}
          </span>
          <span className={results.sentenceResult} aria-hidden>
            <strong className={results.sentenceCount}>
              {resultSentence.count}
            </strong>
            <span className={results.sentenceUnit}>個地方</span>
          </span>
        </h2>
        <div className={styles.resultHeaderActions}>
          {viewportSearchActive ? (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={onClearViewportSearch}
            >
              看全台
            </button>
          ) : hasExtraFilters ? (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={onClearFilters}
            >
              清除條件
            </button>
          ) : null}
          {showMapAction ? (
            <button
              type="button"
              id={OPEN_MAP_BUTTON_ID}
              className={styles.openMapButton}
              onClick={onOpenMap}
            >
              看地圖
            </button>
          ) : null}
        </div>
      </div>
      {editorialPick ? (
        <PlayMapEditorialPick
          place={editorialPick.place}
          reason={editorialPick.reason}
          onSelect={onSelect}
        />
      ) : null}
      {matchedCount === 0 ? (
        <div className={styles.listEmpty}>
          <span className={styles.brandAnchor} aria-hidden>
            <DuduSprite emotion="surprised" decorative />
          </span>
          <p className={styles.listEmptyText} role="status">
            {viewportSearchActive
              ? "這個區域目前沒有符合條件的景點"
              : "目前沒有符合條件的地點，試試改意圖或放寬篩選。"}
          </p>
          {viewportSearchActive ? (
            <button
              type="button"
              className={styles.clearFilters}
              onClick={onClearViewportSearch}
            >
              看全台
            </button>
          ) : hasExtraFilters ? (
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

      {groupNote ? <p className={results.groupNote}>{groupNote}</p> : null}

      {/*
        命中者依分組輸出；批次遮蔽以跨組連續的 displayIndex 判定，
        組內編號連續，所以整組是否可見看第一筆就夠。
      */}
      {groups.map((group) => (
        <section
          key={group.key}
          className={results.group}
          hidden={(group.items[0]?.displayIndex ?? 0) >= visibleCount}
          aria-labelledby={`play-map-group-${group.key}`}
        >
          <h3
            id={`play-map-group-${group.key}`}
            className={results.groupHeadline}
          >
            {group.headline}
          </h3>
          <ul className={styles.cardGrid}>
            {group.items.map(({ place, displayIndex }) => (
              <PlayMapCard
                key={place.id}
                place={place}
                hidden={displayIndex >= visibleCount}
                distanceLabel={distanceLabelFor(place, userLatLng)}
                selected={selectedId === place.id}
                hovered={hoveredPlaceId === place.id}
                hoverCorrelationEnabled={hoverCorrelationEnabled}
                onHover={onHover}
                onBlur={onBlur}
                onSelect={onSelect}
                registerCardRef={registerCardRef}
              />
            ))}
          </ul>
        </section>
      ))}

      {/* 未命中者仍全量掛 hidden，保留 SSR／索引可發現性——不得 slice。 */}
      <ul className={styles.cardGrid}>
        {unmatched.map((place) => (
          <PlayMapCard
            key={`hidden-${place.id}`}
            place={place}
            hidden
            distanceLabel={null}
            selected={false}
            hovered={false}
            hoverCorrelationEnabled={hoverCorrelationEnabled}
            onHover={onHover}
            onBlur={onBlur}
            onSelect={onSelect}
            registerCardRef={registerCardRef}
          />
        ))}
      </ul>

      {matchedCount > 0 ? (
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
      <p className={styles.coverageFootnote}>{coverageLabel}</p>
    </>
  );
}
