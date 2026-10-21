"use client";

import DuduSprite from "@/components/dudu/DuduSprite";
import Icon from "@/components/ui/Icon";
import type { Playground } from "@/data/playgrounds";
import { scenarioReason } from "@/lib/play-map-scenario-reason";
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
  activeScenario,
  extraScenarioChips,
  onClearScenario,
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
  editorialPick,
  visibleCount,
  canLoadMore,
  visibleCountLabel,
  loadMoreLabel,
  onLoadMore,
  topRef,
}: PlayMapCardListProps) {
  return (
    <>
      <div ref={topRef} className={styles.cardListTop} aria-hidden />
      <div className={styles.resultHeader}>
        {/*
          視覺上是「台北市下雨也能玩 · 3 處」一行＋更多條件小字；讀屏要讀成一句完整的話，
          所以 accessible name 由 srText 提供，內層一律 aria-hidden。
        */}
        <h2 className={results.sentence} aria-label={resultSentence.srText}>
          <span className={results.sentenceMain} aria-hidden>
            {resultSentence.mainLead}
            <span className={results.sentenceCount}>{` · ${resultSentence.countLabel}`}</span>
          </span>
          {resultSentence.moreFacetLabels.length > 0 ? (
            <span className={results.sentenceFacets} aria-hidden>
              {`條件：${resultSentence.moreFacetLabels.join("・")}`}
            </span>
          ) : null}
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
      {/*
        舊分享網址同時帶多個情境參數：不亮任何情境卡、也不偷偷篩選，
        每個條件都列成看得到、可各自取消的 chip。點任一情境卡就正規化成單一情境。
      */}
      {extraScenarioChips.length > 0 ? (
        <div className={results.scenarioChips} role="group" aria-label="目前套用的情境">
          {extraScenarioChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className={results.scenarioChip}
              data-scenario-chip={chip.id}
              aria-label={`取消「${chip.label}」`}
              onClick={() => onClearScenario(chip.id)}
            >
              {chip.label}
              <Icon name="close" size={14} />
            </button>
          ))}
        </div>
      ) : null}
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
              : "目前沒有符合條件的地點，試試換個情境或放寬更多條件。"}
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
            <span className={results.groupLabel}>{group.label}</span>
            <span className={results.groupCount}>{group.count} 個</span>
          </h3>
          <ul className={styles.cardGrid}>
            {group.items.map(({ place, displayIndex }) => (
              <PlayMapCard
                key={place.id}
                place={place}
                reason={activeScenario ? scenarioReason(place, activeScenario) : null}
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
            reason={null}
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
          {canLoadMore ? (
            <button
              type="button"
              className={styles.loadMore}
              onClick={onLoadMore}
            >
              {loadMoreLabel}
            </button>
          ) : null}
          <p className={styles.loadMoreStatus} role="status" aria-live="polite">
            {visibleCountLabel}
          </p>
        </div>
      ) : null}
    </>
  );
}
