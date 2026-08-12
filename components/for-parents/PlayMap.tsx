"use client";

import dynamic from "next/dynamic";
import type { PlaygroundType } from "@/data/playgrounds";
import type { BrowseView } from "./PlayMapContract";
import { PlayMapCardList } from "./PlayMapCardList";
import { PlayMapFilters } from "./PlayMapFilters";
import { PlayMapIntentRow } from "./PlayMapIntentRow";
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

  return (
    <div className={styles.root}>
      <PlayMapToolbar
        coverageLabel={map.coverageLabel}
        browseView={map.browseView}
        onSelectView={map.handleSelectView}
        onTabKeyDown={map.handleTabKeyDown}
      />

      <PlayMapIntentRow
        nearMeActive={map.userLatLng !== null}
        geoStatus={map.geoStatus}
        freeOnly={map.freeOnly}
        indoorOnly={map.indoorOnly}
        onNearMe={map.handleNearMe}
        onToggleFree={map.handleToggleFree}
        onToggleIndoor={map.handleToggleIndoor}
      />

      <PlayMapFilters
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
        indoorOnly={map.indoorOnly}
        freeOnly={map.freeOnly}
        onToggleIndoor={map.handleToggleIndoor}
        onToggleFree={map.handleToggleFree}
      />

      <div className={styles.content}>
        <section
          id="play-map-panel-cards"
          role="tabpanel"
          aria-labelledby="play-map-tab-cards"
          hidden={map.browseView !== "cards"}
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
            visibleCount={map.visibleCount}
            canLoadMore={map.canLoadMore}
            visibleCountLabel={map.visibleCountLabel}
            onLoadMore={map.handleLoadMore}
            topRef={map.cardListTopRef}
          />
        </section>

        <div
          id="play-map-panel-map"
          role="tabpanel"
          aria-labelledby="play-map-tab-map"
          hidden={map.browseView !== "map"}
          className={styles.mapShell}
        >
          {map.browseView === "map" ? (
            <PlayMapLeaflet
              places={map.filtered}
              points={map.points}
              emptyCenter={map.cityCenter}
              selectedId={map.selectedId}
              onSelect={map.handleSelectFromMap}
              reduceMotion={map.reduceMotion}
              active={map.browseView === "map"}
            />
          ) : null}
        </div>
      </div>

      {map.selected ? (
        <PlayMapSheet
          place={map.selected}
          variant={map.sheetVariant}
          onClose={map.handleCloseSheet}
          onExpand={map.handleExpandSheet}
          panelRef={map.sheetRef}
        />
      ) : null}
    </div>
  );
}
