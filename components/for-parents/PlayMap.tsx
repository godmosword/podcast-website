"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  listCities,
  listPlaygrounds,
  PLAYGROUND_TYPES,
  type Playground,
  type PlaygroundSourceKind,
  type PlaygroundType,
} from "@/data/playgrounds";
import {
  buildPlayMapQueryString,
  countByCity,
  countByType,
  filterPlaygrounds,
  type PlayMapQuery,
  type PlayMapView,
} from "@/lib/playgrounds-query";
import {
  coverageHeadline,
  DEFAULT_PLAY_MAP_CITY,
  DEFAULT_PLAY_MAP_CENTER,
  listCityCoverage,
} from "@/lib/playground-coverage";
import styles from "./PlayMap.module.css";

const PlayMapLeaflet = dynamic(() => import("./PlayMapLeaflet"), {
  ssr: false,
  loading: () => (
    <p className={styles.mapLoading} role="status" aria-live="polite">
      地圖載入中…
    </p>
  ),
});

type BrowseView = PlayMapView;

const VIEW_TABS: readonly {
  view: BrowseView;
  label: string;
  id: string;
  panelId: string;
}[] = [
  {
    view: "cards",
    label: "卡片",
    id: "play-map-tab-cards",
    panelId: "play-map-panel-cards",
  },
  {
    view: "map",
    label: "地圖",
    id: "play-map-tab-map",
    panelId: "play-map-panel-map",
  },
];

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduce;
}

function formatAgeRange(ageRange: [number, number]): string {
  return `${ageRange[0]}–${ageRange[1]} 歲`;
}

function formatVerifiedDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  if (!year || !month || !day) return iso;
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function sourceKindLabel(kind: PlaygroundSourceKind): string {
  switch (kind) {
    case "official":
      return "官方";
    case "gov":
      return "政府";
    case "editorial":
      return "編輯";
  }
}

function needsCommercialNotice(place: Playground): boolean {
  return !place.free;
}

function buildFilterSummaryParts(
  city: string,
  typeFilter: PlaygroundType | null,
  indoorOnly: boolean,
  freeOnly: boolean,
): string[] {
  const parts = [city];
  if (typeFilter) parts.push(typeFilter);
  if (indoorOnly) parts.push("室內");
  if (freeOnly) parts.push("免費");
  return parts;
}

function typeDataAttr(type: PlaygroundType): string {
  switch (type) {
    case "公園":
      return "park";
    case "室內樂園":
      return "indoor-park";
    case "主題樂園":
      return "theme-park";
    case "博物館":
      return "museum";
    case "動物園":
      return "zoo";
    case "農場":
      return "farm";
    case "其他":
      return "other";
  }
}

type PlayMapSheetProps = {
  place: Playground;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

const SHEET_BG_HINT_ID = "play-map-sheet-bg-hint";

function PlayMapSheet({ place, onClose, panelRef }: PlayMapSheetProps) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [panelRef, place.id]);

  return (
    <aside
      ref={panelRef}
      className={styles.sheet}
      role="region"
      aria-label={`${place.name} 詳情`}
      aria-describedby={SHEET_BG_HINT_ID}
      tabIndex={-1}
    >
      <p id={SHEET_BG_HINT_ID} className={styles.sheetBgHint}>
        關閉後可繼續瀏覽地圖與列表，不需離開本頁。
      </p>
      <div className={styles.sheetHeader}>
        <h2 className={styles.sheetTitle}>{place.name}</h2>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="關閉地點詳情"
        >
          關閉
        </button>
      </div>

      <p className={styles.meta}>
        {place.city}
        {place.district ? ` · ${place.district}` : ""}
        {" · "}
        {place.type}
        {" · "}
        {formatAgeRange(place.ageRange)}
        {" · "}
        {place.free ? "免費" : "需購票"}
        {" · "}
        {place.indoor ? "室內" : "戶外"}
      </p>

      {place.tips ? (
        <p className={styles.tips}>
          <span className={styles.tipsLabel}>Tips</span>
          {place.tips}
        </p>
      ) : null}

      {place.feeNote ? (
        <p className={styles.feeNote}>
          <span className={styles.feeNoteLabel}>收費</span>
          {place.feeNote}
        </p>
      ) : null}

      {needsCommercialNotice(place) ? (
        <p className={styles.volatilityNotice} role="note">
          票價與營業時間易變動，出發前請以官網為準。
        </p>
      ) : null}

      <p className={styles.address}>{place.address}</p>

      <p className={styles.verified}>
        資料最後核對：{formatVerifiedDate(place.lastVerified)}
      </p>

      {place.sources.length > 0 ? (
        <details className={styles.sourcesDetails}>
          <summary className={styles.sourcesSummary}>資料來源</summary>
          <ul className={styles.sourcesList}>
            {place.sources.map((source) => (
              <li key={`${source.kind}-${source.url}`}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${source.name}（${sourceKindLabel(source.kind)}，另開視窗）`}
                >
                  {source.name}
                  <span className={styles.sourceKind}>
                    {sourceKindLabel(source.kind)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <div className={styles.actions}>
        <a
          className={styles.navButton}
          href={buildGoogleMapsNavUrl(place.lat, place.lng)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`開啟 Google 地圖導航前往 ${place.name}（另開視窗）`}
        >
          導航
        </a>
        <a
          className={styles.placeLink}
          href={buildGoogleMapsPlaceUrl(place.lat, place.lng)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`在 Google 地圖只顯示 ${place.name} 位置（另開視窗）`}
        >
          顯示位置
        </a>
        {place.officialUrl ? (
          <a
            className={styles.officialLink}
            href={place.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`開啟 ${place.name} 官網（另開視窗）`}
          >
            官網
          </a>
        ) : null}
      </div>
    </aside>
  );
}

type PlaygroundCardProps = {
  place: Playground;
  selected: boolean;
  /** 不符合當前篩選：仍留在 SSR HTML（可被索引），但不進無障礙樹與視覺。 */
  hidden: boolean;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function PlaygroundCard({
  place,
  selected,
  hidden,
  onSelect,
}: PlaygroundCardProps) {
  return (
    <li hidden={hidden}>
      <article
        className={[styles.card, selected ? styles.cardSelected : ""]
          .filter(Boolean)
          .join(" ")}
        data-type={typeDataAttr(place.type)}
      >
        <button
          type="button"
          className={styles.cardMain}
          aria-expanded={selected}
          onClick={(event) => onSelect(place.id, event.currentTarget)}
        >
          <span className={styles.cardType}>{place.type}</span>
          <span className={styles.cardName}>{place.name}</span>
          <span className={styles.cardMeta}>
            {place.district ?? place.city}
          </span>
          <span className={styles.cardFlags}>
            {place.free ? (
              <span className={styles.flag}>免費</span>
            ) : (
              <span className={styles.flagMuted}>需購票</span>
            )}
            {place.indoor ? (
              <span className={styles.flag}>室內</span>
            ) : (
              <span className={styles.flagMuted}>戶外</span>
            )}
          </span>
        </button>
        <a
          className={styles.cardNav}
          href={buildGoogleMapsNavUrl(place.lat, place.lng)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`導航前往 ${place.name}（另開視窗）`}
        >
          導航
        </a>
      </article>
    </li>
  );
}

export type PlayMapProps = {
  defaultCity?: string;
  /** 由網址參數解析而來的首屏狀態，讓 deep link 的 SSR 與 client 一致。 */
  initialCity?: string;
  initialType?: PlaygroundType | null;
  initialIndoorOnly?: boolean;
  initialFreeOnly?: boolean;
  initialView?: BrowseView;
};

export default function PlayMap({
  defaultCity = DEFAULT_PLAY_MAP_CITY,
  initialCity,
  initialType = null,
  initialIndoorOnly = false,
  initialFreeOnly = false,
  initialView = "cards",
}: PlayMapProps) {
  const cities = useMemo(() => listCities(), []);
  const coverage = useMemo(() => listCityCoverage(), []);
  const allPlaces = useMemo(() => listPlaygrounds(), []);
  const reduceMotion = usePrefersReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const [city, setCity] = useState(initialCity ?? defaultCity);
  const [typeFilter, setTypeFilter] = useState<PlaygroundType | null>(
    initialType,
  );
  const [indoorOnly, setIndoorOnly] = useState(initialIndoorOnly);
  const [freeOnly, setFreeOnly] = useState(initialFreeOnly);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [browseView, setBrowseView] = useState<BrowseView>(initialView);

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cityScrollerRef = useRef<HTMLDivElement>(null);
  const userClosedSheetRef = useRef(false);

  const filtered = useMemo(
    () =>
      filterPlaygrounds({
        city,
        indoorOnly,
        freeOnly,
        type: typeFilter ?? undefined,
      }),
    [city, indoorOnly, freeOnly, typeFilter],
  );

  const matchedIds = useMemo(
    () => new Set(filtered.map((place) => place.id)),
    [filtered],
  );

  /** 目前縣市＋進階開關下，各類型還剩幾筆（0 筆的 chip 停用，避免點進空結果）。 */
  const typeCounts = useMemo(
    () => countByType({ city, indoorOnly, freeOnly }),
    [city, indoorOnly, freeOnly],
  );

  const points = useMemo(
    (): Array<[number, number]> => filtered.map((place) => [place.lat, place.lng]),
    [filtered],
  );

  const selected = selectedId
    ? (filtered.find((place) => place.id === selectedId) ?? null)
    : null;

  /** 縣市 chip 的「· N」與類型 chip 同語意：都是「套用其他條件後的剩餘數」。 */
  const cityCounts = useMemo(
    () =>
      countByCity({
        indoorOnly,
        freeOnly,
        type: typeFilter ?? undefined,
      }),
    [indoorOnly, freeOnly, typeFilter],
  );

  const cityPlaces = useMemo(
    () => filterPlaygrounds({ city }),
    [city],
  );

  const cityCenter = useMemo((): [number, number] => {
    const first = cityPlaces[0];
    if (first) return [first.lat, first.lng];
    return DEFAULT_PLAY_MAP_CENTER;
  }, [cityPlaces]);

  const hasExtraFilters =
    typeFilter !== null || indoorOnly || freeOnly;

  const filterSummaryParts = buildFilterSummaryParts(
    city,
    typeFilter,
    indoorOnly,
    freeOnly,
  );

  const filterSummaryLabel =
    filtered.length === 0
      ? `${filterSummaryParts.join(" · ")} → 0 個地點`
      : `${filterSummaryParts.join(" · ")} → ${filtered.length} 個地點`;

  /**
   * 把狀態寫回網址（沿用 StoryFilter 慣例：互動時顯式 replace，不用 mount 觸發的 effect）。
   * 呼叫端傳「下一個值」，避免讀到尚未 commit 的 state。
   */
  const syncUrl = useCallback(
    (next: Partial<PlayMapQuery>) => {
      const qs = buildPlayMapQueryString(
        {
          city,
          type: typeFilter,
          indoorOnly,
          freeOnly,
          view: browseView,
          ...next,
        },
        defaultCity,
      );
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [
      city,
      typeFilter,
      indoorOnly,
      freeOnly,
      browseView,
      defaultCity,
      pathname,
      router,
    ],
  );

  const handleSelectCity = useCallback(
    (nextCity: string) => {
      setCity(nextCity);
      syncUrl({ city: nextCity });
    },
    [syncUrl],
  );

  const handleSelectType = useCallback(
    (nextType: PlaygroundType | null) => {
      setTypeFilter(nextType);
      syncUrl({ type: nextType });
    },
    [syncUrl],
  );

  const handleToggleIndoor = useCallback(() => {
    const next = !indoorOnly;
    setIndoorOnly(next);
    syncUrl({ indoorOnly: next });
  }, [indoorOnly, syncUrl]);

  const handleToggleFree = useCallback(() => {
    const next = !freeOnly;
    setFreeOnly(next);
    syncUrl({ freeOnly: next });
  }, [freeOnly, syncUrl]);

  const handleSelectView = useCallback(
    (next: BrowseView) => {
      setBrowseView(next);
      syncUrl({ view: next });
    },
    [syncUrl],
  );

  /** ARIA tabs 模式：方向鍵／Home／End 切換並把焦點帶到目標 tab。 */
  const handleTabKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const index = VIEW_TABS.findIndex((tab) => tab.view === browseView);
      let nextIndex: number | null = null;

      if (event.key === "ArrowRight") nextIndex = (index + 1) % VIEW_TABS.length;
      else if (event.key === "ArrowLeft")
        nextIndex = (index - 1 + VIEW_TABS.length) % VIEW_TABS.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = VIEW_TABS.length - 1;
      if (nextIndex === null) return;

      event.preventDefault();
      const nextTab = VIEW_TABS[nextIndex];
      handleSelectView(nextTab.view);
      event.currentTarget
        .querySelector<HTMLButtonElement>(
          `[data-view-tab="${nextTab.view}"]`,
        )
        ?.focus();
    },
    [browseView, handleSelectView],
  );

  const handleClearFilters = useCallback(() => {
    setTypeFilter(null);
    setIndoorOnly(false);
    setFreeOnly(false);
    syncUrl({ type: null, indoorOnly: false, freeOnly: false });
  }, [syncUrl]);

  const handleSelect = useCallback((id: string, trigger: HTMLElement) => {
    lastTriggerRef.current = trigger;
    setSelectedId(id);
  }, []);

  const handleCloseSheet = useCallback(() => {
    userClosedSheetRef.current = true;
    setSelectedId(null);
  }, []);

  useEffect(() => {
    if (selectedId && !filtered.some((place) => place.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    if (selected) return;
    if (!userClosedSheetRef.current) return;
    lastTriggerRef.current?.focus();
    userClosedSheetRef.current = false;
  }, [selected]);

  /*
   * 上一頁／下一頁時 App Router 會保留這個 client component，只換掉 server 傳來的
   * initial* props；useState 的初值只在 mount 取一次，因此需要逐一同步回 state，
   * 否則網址變了畫面卻停在舊條件（沿用 StoryFilter 的「每個 prop 一個 effect」慣例）。
   */
  useEffect(() => {
    if (initialCity !== undefined) setCity(initialCity);
  }, [initialCity]);

  useEffect(() => {
    setTypeFilter(initialType);
  }, [initialType]);

  useEffect(() => {
    setIndoorOnly(initialIndoorOnly);
  }, [initialIndoorOnly]);

  useEffect(() => {
    setFreeOnly(initialFreeOnly);
  }, [initialFreeOnly]);

  useEffect(() => {
    setBrowseView(initialView);
  }, [initialView]);

  // 縣市 chip 是橫向捲動列，選中的可能在畫面外（deep link 尤其）；帶它進視野。
  useEffect(() => {
    const chip = cityScrollerRef.current?.querySelector<HTMLElement>(
      `[data-city-chip="${city}"]`,
    );
    chip?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [city]);

  /*
   * 註：這裡刻意「不」自動捲動地圖對位。
   * 置頂導覽列是半透明的，把地圖捲到緊貼它下方會讓篩選摘要文字透出來疊在導覽列上
   * （實測 active 連結對比掉到 3.91，axe color-contrast serious）。
   * 導覽列遮擋改由兩個不動版面的手段解決：縮放控制移到 bottomright，
   * 以及 fitBounds 的 paddingTopLeft 加大，讓最北標記不會落進被遮的那條帶狀區。
   */

  return (
    <div className={styles.root}>
      <header className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>親子遊樂地圖</h1>
          <p className={styles.coverage}>{coverageHeadline(coverage)}</p>
        </div>

        <div
          className={styles.viewTabs}
          role="tablist"
          aria-label="瀏覽方式"
          onKeyDown={handleTabKeyDown}
        >
          {VIEW_TABS.map((tab) => {
            const active = browseView === tab.view;
            return (
              <button
                key={tab.view}
                type="button"
                role="tab"
                id={tab.id}
                data-view-tab={tab.view}
                aria-selected={active}
                aria-controls={tab.panelId}
                // roving tabindex：只有選中的 tab 進 Tab 順序，其餘用方向鍵移動。
                tabIndex={active ? 0 : -1}
                className={[styles.viewTab, active ? styles.viewTabActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => handleSelectView(tab.view)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

      </header>

      <form className={styles.filters} aria-label="遊樂地點篩選">
        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>縣市</span>
          <div
            ref={cityScrollerRef}
            className={styles.chipScroller}
            role="group"
            aria-label="依縣市篩選"
          >
            {cities.map((item) => {
              const count = cityCounts.get(item) ?? 0;
              return (
                <button
                  key={item}
                  type="button"
                  data-city-chip={item}
                  className={styles.chip}
                  aria-pressed={city === item}
                  // 「公園 · 5」讀屏會唸成「公園 五」，補完整語意。
                  aria-label={`${item}，${count} 個地點`}
                  onClick={() => handleSelectCity(item)}
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
              className={styles.chip}
              aria-pressed={typeFilter === null}
              onClick={() => handleSelectType(null)}
            >
              全部
            </button>
            {PLAYGROUND_TYPES.map((item) => {
              const count = typeCounts.get(item) ?? 0;
              const selected = typeFilter === item;
              // 0 筆時停用，但已選中的不停用——否則使用者無法取消自己造成的空結果。
              const disabled = count === 0 && !selected;
              return (
                <button
                  key={item}
                  type="button"
                  className={styles.chip}
                  aria-pressed={selected}
                  disabled={disabled}
                  aria-label={`${item}，${count} 個地點`}
                  onClick={() => handleSelectType(item)}
                >
                  {`${item} · ${count}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className={styles.chipGroup} role="group" aria-label="進階篩選">
          <button
            type="button"
            className={styles.chip}
            aria-pressed={indoorOnly}
            onClick={handleToggleIndoor}
          >
            室內
          </button>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={freeOnly}
            onClick={handleToggleFree}
          >
            免費
          </button>
        </div>
      </form>

      <div className={styles.filterSummary} aria-live="polite">
        <p className={styles.filterSummaryText}>{filterSummaryLabel}</p>
        {/* 0 筆時清除鈕由空狀態那顆負責，這裡不重複渲染同名按鈕 */}
        {hasExtraFilters && filtered.length > 0 ? (
          <button
            type="button"
            className={styles.clearFilters}
            onClick={handleClearFilters}
          >
            清除條件
          </button>
        ) : null}
      </div>

      <div className={styles.content}>
        <section
          id="play-map-panel-cards"
          role="tabpanel"
          aria-labelledby="play-map-tab-cards"
          hidden={browseView !== "cards"}
          className={styles.cardsPanel}
        >
          {filtered.length === 0 ? (
            <div className={styles.listEmpty} role="status">
              <p className={styles.listEmptyText}>
                目前沒有符合條件的地點，試試放寬篩選。
              </p>
              {hasExtraFilters ? (
                <button
                  type="button"
                  className={styles.clearFilters}
                  onClick={handleClearFilters}
                >
                  清除條件
                </button>
              ) : null}
            </div>
          ) : null}

          {/*
            全部 73 筆都渲染進 SSR HTML（不符條件者掛 hidden），
            讓各縣市地點名稱可被搜尋引擎索引；hidden 同時排除於無障礙樹。
          */}
          <ul className={styles.cardGrid}>
            {allPlaces.map((place) => (
              <PlaygroundCard
                key={place.id}
                place={place}
                hidden={!matchedIds.has(place.id)}
                selected={selectedId === place.id}
                onSelect={handleSelect}
              />
            ))}
          </ul>
        </section>

        <div
          id="play-map-panel-map"
          role="tabpanel"
          aria-labelledby="play-map-tab-map"
          hidden={browseView !== "map"}
          className={styles.mapShell}
        >
          {browseView === "map" ? (
            <PlayMapLeaflet
              places={filtered}
              points={points}
              emptyCenter={cityCenter}
              selectedId={selectedId}
              onSelect={handleSelect}
              reduceMotion={reduceMotion}
              active={browseView === "map"}
            />
          ) : null}
        </div>
      </div>

      {selected ? (
        <PlayMapSheet
          place={selected}
          onClose={handleCloseSheet}
          panelRef={sheetRef}
        />
      ) : null}
    </div>
  );
}
