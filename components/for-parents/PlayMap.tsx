"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import type { PlaygroundType } from "@/data/playgrounds";
import { CARDS_PANEL_ID, MAP_PANEL_ID, type BrowseView } from "./PlayMapContract";
import { PlayMapCardList } from "./PlayMapCardList";
import { PlayMapControlBar } from "./PlayMapControlBar";
import { PlayMapSheet } from "./PlayMapSheet";
import { PlayMapToolbar } from "./PlayMapToolbar";
import { usePlayMapFilters } from "./usePlayMapFilters";
import { usePlayMapViewport } from "./usePlayMapViewport";
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
  initialOutdoorOnly?: boolean;
  initialFreeOnly?: boolean;
  initialRainyDayOnly?: boolean;
  initialParkingOnly?: boolean;
  initialStrollerFriendlyOnly?: boolean;
  initialHighEnergyOnly?: boolean;
  initialView?: BrowseView;
};

export default function PlayMap({
  initialCity = null,
  initialType = null,
  initialIndoorOnly = false,
  initialOutdoorOnly = false,
  initialFreeOnly = false,
  initialRainyDayOnly = false,
  initialParkingOnly = false,
  initialStrollerFriendlyOnly = false,
  initialHighEnergyOnly = false,
  initialView = "cards",
}: PlayMapProps) {
  const viewport = usePlayMapViewport();
  const map = usePlayMapFilters({
    initialCity,
    initialType,
    initialIndoorOnly,
    initialOutdoorOnly,
    initialFreeOnly,
    initialRainyDayOnly,
    initialParkingOnly,
    initialStrollerFriendlyOnly,
    initialHighEnergyOnly,
    initialView,
    viewportBounds: viewport.committedSearchBounds,
  });
  /**
   * 第一次需要顯示地圖後保持掛載，之後只靠 hidden。
   * 進頁若是名單模式，先不掛 Leaflet，避免搶首屏。
   *
   * 在 render 期間 latch：showMap 轉 true 必定伴隨一次 state 觸發的重繪，
   * 同一次 commit 就能決定是否渲染 Leaflet，不必晚一幀才掛載。
   */
  const mapMountedRef = useRef(map.showMap);
  if (map.showMap) mapMountedRef.current = true;

  const cardRefs = useRef(new Map<string, HTMLLIElement>());
  const cardPanelRef = useRef<HTMLElement>(null);
  const registerCardRef = useCallback(
    (id: string, element: HTMLLIElement | null) => {
      if (element) cardRefs.current.set(id, element);
      else cardRefs.current.delete(id);
    },
    [],
  );

  const scrollCardIntoView = useCallback(
    (id: string) => {
      if (!map.splitLayout) return;
      const card = cardRefs.current.get(id);
      const panel = cardPanelRef.current;
      if (!card || card.hidden || !panel || panel.clientHeight <= 0) return;

      const panelRect = panel.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const currentTop = panel.scrollTop;
      const cardTop = currentTop + cardRect.top - panelRect.top;
      const cardBottom = currentTop + cardRect.bottom - panelRect.top;
      const nextTop =
        cardTop < currentTop
          ? cardTop
          : cardBottom > currentTop + panel.clientHeight
            ? cardBottom - panel.clientHeight
            : currentTop;
      if (nextTop === currentTop) return;

      if (typeof panel.scrollTo === "function") {
        panel.scrollTo({
          top: Math.max(0, nextTop),
          behavior: map.reduceMotion ? "auto" : "smooth",
        });
      } else {
        panel.scrollTop = Math.max(0, nextTop);
      }
    },
    [map.reduceMotion, map.splitLayout],
  );

  const selectFromMap = map.handleSelectFromMap;
  const selectedCity = map.city;
  const filteredPlaces = map.filtered;
  const unmatchedPlaces = map.unmatchedPlaces;
  const selectCity = map.handleSelectCity;
  const showOnMap = map.handleShowOnMap;
  const resetViewportForMajorFilter = viewport.handleResetForMajorFilter;
  const handleSelectFromMap = useCallback(
    (id: string, trigger: HTMLElement) => {
      selectFromMap(id, trigger);
      scrollCardIntoView(id);
    },
    [scrollCardIntoView, selectFromMap],
  );
  const handleSelectCity = useCallback(
    (nextCity: string | null) => {
      if (nextCity !== selectedCity) resetViewportForMajorFilter();
      selectCity(nextCity);
    },
    [resetViewportForMajorFilter, selectCity, selectedCity],
  );
  const handleShowOnMap = useCallback(
    (id: string, trigger: HTMLElement) => {
      if (selectedCity === null) {
        const place = [...filteredPlaces, ...unmatchedPlaces].find(
          (item) => item.id === id,
        );
        if (place) resetViewportForMajorFilter();
      }
      showOnMap(id, trigger);
    },
    [
      filteredPlaces,
      resetViewportForMajorFilter,
      selectedCity,
      showOnMap,
      unmatchedPlaces,
    ],
  );

  const mobileMap = !map.splitLayout && map.showMap;

  return (
    <div
      className={styles.root}
      data-split={map.splitLayout ? "true" : "false"}
      data-mobile-map={mobileMap ? "true" : "false"}
    >
      <PlayMapToolbar compact={mobileMap} />

      <div hidden={mobileMap}>
        <PlayMapControlBar
          nearMeActive={map.userLatLng !== null}
          geoStatus={map.geoStatus}
          freeOnly={map.freeOnly}
          indoorOnly={map.indoorOnly}
          outdoorOnly={map.outdoorOnly}
          rainyDayOnly={map.rainyDayOnly}
          parkingOnly={map.parkingOnly}
          strollerFriendlyOnly={map.strollerFriendlyOnly}
          highEnergyOnly={map.highEnergyOnly}
          activeFilterCount={map.activeFilterCount}
          onNearMe={map.handleNearMe}
          onToggleFree={map.handleToggleFree}
          onToggleIndoor={map.handleToggleIndoor}
          onToggleRainyDay={map.handleToggleRainyDay}
          onToggleParking={map.handleToggleParking}
          onToggleStrollerFriendly={map.handleToggleStrollerFriendly}
          onToggleHighEnergy={map.handleToggleHighEnergy}
          filtersOpen={map.filtersOpen}
          onToggleFilters={map.handleToggleFilters}
          resultTitle={map.resultTitle}
          onSelectEnvironment={map.handleSelectEnvironment}
          cities={map.cities}
          city={map.city}
          cityCounts={map.cityCounts}
          allCityCount={map.allCityCount}
          onSelectCity={handleSelectCity}
          cityScrollerRef={map.cityScrollerRef}
          typeFilter={map.typeFilter}
          typeCounts={map.typeCounts}
          visibleTypeOptions={map.visibleTypeOptions}
          onSelectType={map.handleSelectType}
        />
      </div>

      <div className={styles.content}>
        <section
          id={CARDS_PANEL_ID}
          ref={cardPanelRef}
          role="region"
          aria-label="地點名單"
          hidden={!map.showCards}
          className={styles.cardsPanel}
        >
          <PlayMapCardList
            matched={map.filtered}
            unmatched={map.unmatchedPlaces}
            selectedId={map.selectedId}
            hoveredPlaceId={map.hoveredPlaceId}
            hoverCorrelationEnabled={map.splitLayout}
            userLatLng={map.userLatLng}
            hasExtraFilters={map.hasExtraFilters}
            onClearFilters={map.handleClearFilters}
            viewportSearchActive={map.viewportSearchActive}
            onClearViewportSearch={viewport.handleClearViewportSearch}
            onHover={map.handleHoverPlace}
            onBlur={map.handleBlurPlace}
            onSelect={map.handleSelectFromCard}
            registerCardRef={registerCardRef}
            resultTitle={map.resultTitle}
            showMapAction={!map.splitLayout}
            onOpenMap={() => map.handleSelectView("map")}
            coverageLabel={map.coverageLabel}
            editorialPick={map.showCards ? map.editorialPick : null}
            visibleCount={map.visibleCount}
            canLoadMore={map.canLoadMore}
            visibleCountLabel={map.visibleCountLabel}
            onLoadMore={map.handleLoadMore}
            topRef={map.cardListTopRef}
          />
        </section>

        <div
          id={MAP_PANEL_ID}
          role="region"
          aria-label="地點地圖"
          hidden={!map.showMap}
          className={styles.mapShell}
        >
          {mobileMap ? (
            <div className={styles.mapChrome}>
              <button
                type="button"
                className={styles.backToListButton}
                onClick={() => map.handleSelectView("cards")}
              >
                返回名單
              </button>
            </div>
          ) : null}
          {viewport.hasPendingViewportSearch ? (
            <button
              type="button"
              className={styles.viewportSearchButton}
              onClick={viewport.handleCommitViewportSearch}
            >
              搜尋此區域
            </button>
          ) : null}
          {mapMountedRef.current ? (
            <PlayMapLeaflet
              places={map.filtered}
              points={map.points}
              emptyCenter={map.cityCenter}
              selectedId={map.selectedId}
              hoveredPlaceId={map.hoveredPlaceId}
              hoverCorrelationEnabled={map.splitLayout}
              onHover={map.handleHoverPlace}
              onBlur={map.handleBlurPlace}
              onSelect={handleSelectFromMap}
              reduceMotion={map.reduceMotion}
              active={map.showMap}
              clusterMode={map.clusterMode}
              cityClusters={map.cityClusters}
              onSelectCity={handleSelectCity}
              userLatLng={map.userLatLng}
              viewportZoom={viewport.zoom}
              preserveViewport={
                map.viewportSearchActive &&
                !(map.city === null && map.userLatLng !== null)
              }
              onViewportSettled={viewport.handleViewportSettled}
              resizeRequest={0}
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
          onShowOnMap={handleShowOnMap}
          panelRef={map.sheetRef}
        />
      ) : null}
    </div>
  );
}
