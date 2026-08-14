"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import type { PlaygroundType } from "@/data/playgrounds";
import type { BrowseView } from "./PlayMapContract";
import { PlayMapCardList } from "./PlayMapCardList";
import { PlayMapControlBar } from "./PlayMapControlBar";
import { PlayMapSheet } from "./PlayMapSheet";
import { PlayMapToolbar } from "./PlayMapToolbar";
import { usePlayMapFilters } from "./usePlayMapFilters";
import styles from "./PlayMap.module.css";

const PlayMapLeaflet = dynamic(() => import("./PlayMapLeaflet"), {
  ssr: false,
  loading: () => (
    <p className={styles.mapLoading} role="status" aria-live="polite">
      地圖載入中…
    </p>
  ),
});

export type PlayMapProps = {
  /** 由網址參數解析而來的首屏狀態，讓 deep link 的 SSR 與 client 一致。 */
  initialCity?: string | null;
  initialType?: PlaygroundType | null;
  initialIndoorOnly?: boolean;
  initialFreeOnly?: boolean;
  initialView?: BrowseView;
};

export default function PlayMap({
  initialCity = null,
  initialType = null,
  initialIndoorOnly = false,
  initialFreeOnly = false,
  initialView = "cards",
}: PlayMapProps) {
  const map = usePlayMapFilters({
    initialCity,
    initialType,
    initialIndoorOnly,
    initialFreeOnly,
    initialView,
  });
  /**
   * 第一次需要顯示地圖後保持掛載，之後只靠 hidden。
   * 進頁若是卡片分頁，先不掛 Leaflet，避免搶首屏。
   *
   * 在 render 期間 latch：showMap 轉 true 必定伴隨一次 state 觸發的重繪，
   * 同一次 commit 就能決定是否渲染 Leaflet，不必晚一幀才掛載。
   */
  const mapMountedRef = useRef(map.showMap);
  if (map.showMap) mapMountedRef.current = true;

  return (
    <div
      className={styles.root}
      data-split={map.splitLayout ? "true" : "false"}
    >
      <PlayMapToolbar
        howToStart="先點離我最近，或直接點下面卡片看怎麼帶。"
        coverageLabel={map.coverageLabel}
        browseView={map.browseView}
        onSelectView={map.handleSelectView}
        onTabKeyDown={map.handleTabKeyDown}
        hideViewTabs={map.splitLayout}
      />

      <PlayMapControlBar
        nearMeActive={map.userLatLng !== null}
        geoStatus={map.geoStatus}
        freeOnly={map.freeOnly}
        indoorOnly={map.indoorOnly}
        onNearMe={map.handleNearMe}
        onToggleFree={map.handleToggleFree}
        onToggleIndoor={map.handleToggleIndoor}
        filtersOpen={map.filtersOpen}
        onToggleFilters={map.handleToggleFilters}
        filterSummaryLabel={map.filterSummaryLabel}
        canClearFilters={map.hasExtraFilters && map.filtered.length > 0}
        onClearFilters={map.handleClearFilters}
        cities={map.cities}
        city={map.city}
        cityCounts={map.cityCounts}
        allCityCount={map.allCityCount}
        onSelectCity={map.handleSelectCity}
        cityScrollerRef={map.cityScrollerRef}
        typeFilter={map.typeFilter}
        typeCounts={map.typeCounts}
        visibleTypeOptions={map.visibleTypeOptions}
        onSelectType={map.handleSelectType}
      />

      <div className={styles.content}>
        <section
          id="play-map-panel-cards"
          role={map.splitLayout ? "region" : "tabpanel"}
          aria-labelledby={map.splitLayout ? undefined : "play-map-tab-cards"}
          aria-label={map.splitLayout ? "地點名單" : undefined}
          hidden={!map.showCards}
          className={styles.cardsPanel}
        >
          <PlayMapCardList
            matched={map.filtered}
            unmatched={map.unmatchedPlaces}
            selectedId={map.selectedId}
            userLatLng={map.userLatLng}
            hasExtraFilters={map.hasExtraFilters}
            onClearFilters={map.handleClearFilters}
            onSelect={map.handleSelectFromCard}
            showScopeHint={map.clusterMode}
            visibleCount={map.visibleCount}
            canLoadMore={map.canLoadMore}
            visibleCountLabel={map.visibleCountLabel}
            onLoadMore={map.handleLoadMore}
            topRef={map.cardListTopRef}
          />
        </section>

        <div
          id="play-map-panel-map"
          role={map.splitLayout ? "region" : "tabpanel"}
          aria-labelledby={map.splitLayout ? undefined : "play-map-tab-map"}
          aria-label={map.splitLayout ? "地點地圖" : undefined}
          hidden={!map.showMap}
          className={styles.mapShell}
        >
          {mapMountedRef.current ? (
            <PlayMapLeaflet
              places={map.filtered}
              points={map.points}
              emptyCenter={map.cityCenter}
              selectedId={map.selectedId}
              onSelect={map.handleSelectFromMap}
              reduceMotion={map.reduceMotion}
              active={map.showMap}
              clusterMode={map.clusterMode}
              cityClusters={map.cityClusters}
              onSelectCity={map.handleSelectCity}
              userLatLng={map.userLatLng}
              splitLayout={map.splitLayout}
              nearMeCamera={map.city === null && map.userLatLng !== null}
            />
          ) : null}
        </div>
      </div>

      {map.selected ? (
        <PlayMapSheet
          place={map.selected}
          variant={map.sheetVariant}
          distanceLabel={map.selectedDistanceLabel}
          onClose={map.handleCloseSheet}
          onExpand={map.handleExpandSheet}
          onShowOnMap={map.handleShowOnMap}
          panelRef={map.sheetRef}
        />
      ) : null}
    </div>
  );
}
