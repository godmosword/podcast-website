"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlaygroundType } from "@/data/playgrounds";
import { PLAY_MAP_SCENARIOS, scenarioDef } from "@/lib/play-map-scenarios";
import {
  CARDS_PANEL_ID,
  MAP_PANEL_ID,
  OPEN_MAP_BUTTON_ID,
  type BrowseView,
  type PlayMapScenarioCardView,
} from "./PlayMapContract";
import { PlayMapCardList } from "./PlayMapCardList";
import { PlayMapControlBar } from "./PlayMapControlBar";
import { PlayMapLocationBar } from "./PlayMapLocationBar";
import { PlayMapLocationPicker } from "./PlayMapLocationPicker";
import { PlayMapScenarioGrid } from "./PlayMapScenarioGrid";
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
      // 只有並排時名單與地圖同框，才需要把卡片捲進視野。
      if (!map.splitActive) return;
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
    [map.reduceMotion, map.splitActive],
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

  /* ---- 情境卡與選縣市面板 ---- */
  const [locationOpen, setLocationOpen] = useState(false);
  const locationTriggerRef = useRef<HTMLButtonElement>(null);
  /** .content 的頂端＝位置列的原位；選完縣市捲到這裡，位置列回到導覽列下方、名單緊接在下。 */
  const locationAnchorRef = useRef<HTMLDivElement>(null);

  const scenarioCards = useMemo(
    (): PlayMapScenarioCardView[] =>
      PLAY_MAP_SCENARIOS.map((def) => ({
        id: def.id,
        label: def.label,
        quickFilter: def.quickFilter,
        count: map.scenarioCounts.get(def.id) ?? 0,
        pressed: map.activeScenario === def.id,
      })),
    [map.activeScenario, map.scenarioCounts],
  );

  const extraScenarioChips = useMemo(
    () =>
      map.activeScenario === null && map.scenarioFlags.length > 1
        ? map.scenarioFlags.map((id) => ({ id, label: scenarioDef(id).label }))
        : [],
    [map.activeScenario, map.scenarioFlags],
  );
  const activeScenarioLabel = map.activeScenario
    ? scenarioDef(map.activeScenario).label
    : null;
  const clearScenario = map.handleClearScenario;
  const activeScenario = map.activeScenario;
  const handleClearActiveScenario = useCallback(() => {
    if (activeScenario) clearScenario(activeScenario);
  }, [activeScenario, clearScenario]);

  const closeLocation = useCallback(() => setLocationOpen(false), []);
  /**
   * 選完：關閉 → 等捲動鎖解除後把位置列捲到頂（名單緊接在下）→ 焦點由 dialog 還給觸發鈕。
   * 刻意用立即捲動：smooth 動畫還在跑時家長接著點「看地圖」，地圖會被捲到導覽列底下。
   */
  const pendingScrollFrameRef = useRef<number | null>(null);
  const cancelPendingScroll = useCallback(() => {
    if (pendingScrollFrameRef.current === null) return;
    cancelAnimationFrame(pendingScrollFrameRef.current);
    pendingScrollFrameRef.current = null;
  }, []);
  const scrollLocationBarToTop = useCallback(() => {
    cancelPendingScroll();
    pendingScrollFrameRef.current = requestAnimationFrame(() => {
      pendingScrollFrameRef.current = null;
      locationAnchorRef.current?.scrollIntoView?.({ block: "start" });
    });
  }, [cancelPendingScroll]);
  useEffect(() => cancelPendingScroll, [cancelPendingScroll]);
  const handlePickCity = useCallback(
    (nextCity: string | null) => {
      handleSelectCity(nextCity);
      setLocationOpen(false);
      scrollLocationBarToTop();
    },
    [handleSelectCity, scrollLocationBarToTop],
  );
  const nearMe = map.handleNearMe;
  const handlePickNearMe = useCallback(() => {
    nearMe();
    setLocationOpen(false);
    scrollLocationBarToTop();
  }, [nearMe, scrollLocationBarToTop]);

  const mobileMap = !map.splitLayout && map.showMap;
  const wasMobileMapRef = useRef(mobileMap);
  useEffect(() => {
    const enteredMobileMap = !wasMobileMapRef.current && mobileMap;
    const leftMobileMap = wasMobileMapRef.current && !mobileMap;
    wasMobileMapRef.current = mobileMap;
    if (enteredMobileMap) {
      // 選完縣市排程的捲動還沒跑就切進地圖時取消它，免得把地圖捲走。
      cancelPendingScroll();
      // 進全幅地圖時情境卡與位置列都收起來、頁面變短；若原本已往下捲，地圖頂端會跑出畫面。
      document
        .getElementById(MAP_PANEL_ID)
        ?.scrollIntoView?.({ block: "start" });
      return;
    }
    if (!leftMobileMap) return;
    document.getElementById(OPEN_MAP_BUTTON_ID)?.focus();
  }, [cancelPendingScroll, mobileMap]);

  return (
    <div
      className={styles.root}
      data-split={map.splitActive ? "true" : "false"}
      data-mobile-map={mobileMap ? "true" : "false"}
    >
      {/* 地圖模式（手機全幅、桌面並排）把高度讓給地圖：頁首只留 h1，情境卡縮成一列。 */}
      <PlayMapToolbar
        compact={mobileMap || map.splitActive}
        coverageLabel={map.coverageLabel}
      />

      <div className={styles.scenarioSlot} hidden={mobileMap}>
        <PlayMapScenarioGrid
          compact={map.splitActive}
          scenarios={scenarioCards}
          scopeLabel={map.resultSentence.scopeLabel}
          onSelect={map.handleSelectScenario}
        />
      </div>

      {/*
        頁首 → 情境卡 → 位置列（sticky，含更多條件面板）→ 名單。
        位置列放在 .content 裡（display: contents 的 slot），捲完整份名單都黏著；
        桌面地圖並排（view=map）時橫跨名單＋地圖兩欄。手機全幅地圖時整列收起。
      */}
      <div ref={locationAnchorRef} className={styles.content}>
        <div className={styles.controlSlot} hidden={mobileMap}>
          <PlayMapLocationBar
            locationLabel={map.city ?? "全台"}
            locationTriggerRef={locationTriggerRef}
            onOpenLocation={() => setLocationOpen(true)}
            locationOpen={locationOpen}
            nearMeActive={map.userLatLng !== null}
            geoStatus={map.geoStatus}
            onNearMe={map.handleNearMe}
            panelFilterCount={map.panelFilterCount}
            filtersOpen={map.filtersOpen}
            onToggleFilters={map.handleToggleFilters}
            activeScenarioLabel={activeScenarioLabel}
            onClearActiveScenario={handleClearActiveScenario}
          >
            <PlayMapControlBar
              indoorOnly={map.indoorOnly}
              outdoorOnly={map.outdoorOnly}
              parkingOnly={map.parkingOnly}
              strollerFriendlyOnly={map.strollerFriendlyOnly}
              onSelectEnvironment={map.handleSelectEnvironment}
              onToggleParking={map.handleToggleParking}
              onToggleStrollerFriendly={map.handleToggleStrollerFriendly}
              filtersOpen={map.filtersOpen}
              typeFilter={map.typeFilter}
              typeCounts={map.typeCounts}
              visibleTypeOptions={map.visibleTypeOptions}
              onSelectType={map.handleSelectType}
            />
          </PlayMapLocationBar>
        </div>

        <section
          id={CARDS_PANEL_ID}
          ref={cardPanelRef}
          role="region"
          aria-label="地點名單"
          hidden={!map.showCards}
          className={styles.cardsPanel}
        >
          <PlayMapCardList
            groups={map.groups}
            activeScenario={map.activeScenario}
            extraScenarioChips={extraScenarioChips}
            onClearScenario={map.handleClearScenario}
            matchedCount={map.filtered.length}
            unmatched={map.unmatchedPlaces}
            selectedId={map.selectedId}
            hoveredPlaceId={map.hoveredPlaceId}
            hoverCorrelationEnabled={map.splitActive}
            userLatLng={map.userLatLng}
            hasExtraFilters={map.hasExtraFilters}
            onClearFilters={map.handleClearFilters}
            viewportSearchActive={map.viewportSearchActive}
            onClearViewportSearch={viewport.handleClearViewportSearch}
            onHover={map.handleHoverPlace}
            onBlur={map.handleBlurPlace}
            onSelect={map.handleSelectFromCard}
            registerCardRef={registerCardRef}
            resultSentence={map.resultSentence}
            groupNote={map.groupNote}
            showMapAction={
              !map.splitActive && (map.city !== null || map.userLatLng !== null)
            }
            onOpenMap={() => map.handleSelectView("map")}
            editorialPick={map.showCards ? map.editorialPick : null}
            visibleCount={map.visibleCount}
            canLoadMore={map.canLoadMore}
            visibleCountLabel={map.visibleCountLabel}
            loadMoreLabel={map.loadMoreLabel}
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
              hoverCorrelationEnabled={map.splitActive}
              onHover={map.handleHoverPlace}
              onBlur={map.handleBlurPlace}
              onSelect={handleSelectFromMap}
              reduceMotion={map.reduceMotion}
              active={map.showMap}
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

      <PlayMapLocationPicker
        open={locationOpen && !mobileMap}
        onClose={closeLocation}
        returnFocusRef={locationTriggerRef}
        regions={map.regions}
        allCount={map.allCount}
        selectedCity={map.city}
        onSelectCity={handlePickCity}
        uncataloguedCities={map.uncataloguedCities}
        scenarioLabel={activeScenarioLabel}
        nearMeActive={map.userLatLng !== null}
        geoStatus={map.geoStatus}
        onNearMe={handlePickNearMe}
      />

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
