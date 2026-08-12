"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
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
  estimateDriveMinutes,
  formatAgeRangeLabel,
  formatDriveMinutesLabel,
  haversineKm,
  listPlaceDecisionTags,
  sortPlaygrounds,
  type LatLng,
} from "@/lib/playground-distance";
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
type SheetVariant = "compact" | "full";
type SelectSource = "card" | "map";
type GeoStatus = "idle" | "pending" | "ready" | "denied";

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

function cityLabel(city: string | null): string {
  return city ?? "全部";
}

function buildFilterSummaryParts(
  city: string | null,
  typeFilter: PlaygroundType | null,
  indoorOnly: boolean,
  freeOnly: boolean,
): string[] {
  const parts = [cityLabel(city)];
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

function distanceLabelFor(
  place: Playground,
  user: LatLng | null,
): string | null {
  if (!user) return null;
  const minutes = estimateDriveMinutes(
    haversineKm(user, { lat: place.lat, lng: place.lng }),
  );
  return formatDriveMinutesLabel(minutes);
}

type PlayMapSheetProps = {
  place: Playground;
  variant: SheetVariant;
  onClose: () => void;
  onExpand: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

const SHEET_BG_HINT_ID = "play-map-sheet-bg-hint";

function PlayMapSheet({
  place,
  variant,
  onClose,
  onExpand,
  panelRef,
}: PlayMapSheetProps) {
  const compact = variant === "compact";
  const decisionTags = listPlaceDecisionTags(place);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [panelRef, place.id, variant]);

  return (
    <aside
      ref={panelRef}
      className={styles.sheet}
      role="region"
      aria-label={`${place.name} 詳情`}
      aria-describedby={SHEET_BG_HINT_ID}
      tabIndex={-1}
      data-variant={variant}
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

      {place.imageSrc ? (
        <div className={styles.sheetMedia}>
          <Image
            className={styles.sheetImage}
            src={place.imageSrc}
            alt={place.imageAlt ?? `${place.name}實景`}
            width={800}
            height={500}
            sizes="(max-width: 640px) 100vw, 400px"
          />
          {place.imageCredit ? (
            <p className={styles.imageCredit}>{place.imageCredit}</p>
          ) : null}
        </div>
      ) : null}

      {compact ? (
        <>
          {decisionTags.length > 0 ? (
            <ul className={styles.sheetTagList} aria-label="關鍵標籤">
              {decisionTags.map((tag) => (
                <li key={tag} className={styles.flag}>
                  {tag}
                </li>
              ))}
            </ul>
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
            <button
              type="button"
              className={styles.moreButton}
              onClick={onExpand}
            >
              更多
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.meta}>
            {place.city}
            {place.district ? ` · ${place.district}` : ""}
            {" · "}
            {place.type}
            {" · "}
            {formatAgeRangeLabel(place.ageRange)}
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
        </>
      )}
    </aside>
  );
}

type PlaygroundCardProps = {
  place: Playground;
  selected: boolean;
  hidden: boolean;
  distanceLabel: string | null;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function PlaygroundCard({
  place,
  selected,
  hidden,
  distanceLabel,
  onSelect,
}: PlaygroundCardProps) {
  const decisionTags = listPlaceDecisionTags(place);
  const area = place.district ?? place.city;
  const meta = distanceLabel ? `${area} · ${distanceLabel}` : area;

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
          {place.imageSrc ? (
            <span className={styles.cardThumb}>
              <Image
                className={styles.cardThumbImage}
                src={place.imageSrc}
                alt=""
                width={160}
                height={120}
                sizes="120px"
              />
            </span>
          ) : null}
          <span className={styles.cardBody}>
            <span className={styles.cardName}>{place.name}</span>
            <span className={styles.cardMeta}>{meta}</span>
            {decisionTags.length > 0 ? (
              <span className={styles.cardFlags}>
                {decisionTags.map((tag) => (
                  <span key={tag} className={styles.flag}>
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
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
  const cities = useMemo(() => listCities(), []);
  const coverage = useMemo(() => listCityCoverage(), []);
  const allPlaces = useMemo(() => listPlaygrounds(), []);
  const reduceMotion = usePrefersReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const [city, setCity] = useState<string | null>(initialCity);
  const [typeFilter, setTypeFilter] = useState<PlaygroundType | null>(
    initialType,
  );
  const [indoorOnly, setIndoorOnly] = useState(initialIndoorOnly);
  const [freeOnly, setFreeOnly] = useState(initialFreeOnly);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [browseView, setBrowseView] = useState<BrowseView>(initialView);
  const [sheetVariant, setSheetVariant] = useState<SheetVariant>("full");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [userLatLng, setUserLatLng] = useState<LatLng | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const cityScrollerRef = useRef<HTMLDivElement>(null);
  const userClosedSheetRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const sync = () => setFiltersOpen(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const filtered = useMemo(() => {
    const raw = filterPlaygrounds({
      city: city ?? undefined,
      indoorOnly,
      freeOnly,
      type: typeFilter ?? undefined,
    });
    return sortPlaygrounds(raw, userLatLng);
  }, [city, indoorOnly, freeOnly, typeFilter, userLatLng]);

  const matchedIds = useMemo(
    () => new Set(filtered.map((place) => place.id)),
    [filtered],
  );

  const unmatchedPlaces = useMemo(
    () => allPlaces.filter((place) => !matchedIds.has(place.id)),
    [allPlaces, matchedIds],
  );

  /** 目前縣市＋進階開關下，各類型還剩幾筆。 */
  const typeCounts = useMemo(
    () =>
      countByType({
        city: city ?? undefined,
        indoorOnly,
        freeOnly,
      }),
    [city, indoorOnly, freeOnly],
  );

  const points = useMemo(
    (): Array<[number, number]> =>
      filtered.map((place) => [place.lat, place.lng]),
    [filtered],
  );

  const selected = selectedId
    ? (filtered.find((place) => place.id === selectedId) ?? null)
    : null;

  const cityCounts = useMemo(
    () =>
      countByCity({
        indoorOnly,
        freeOnly,
        type: typeFilter ?? undefined,
      }),
    [indoorOnly, freeOnly, typeFilter],
  );

  const allCityCount = useMemo(
    () => [...cityCounts.values()].reduce((sum, n) => sum + n, 0),
    [cityCounts],
  );

  const cityPlaces = useMemo(
    () => filterPlaygrounds({ city: city ?? undefined }),
    [city],
  );

  const cityCenter = useMemo((): [number, number] => {
    const first = cityPlaces[0] ?? filtered[0];
    if (first) return [first.lat, first.lng];
    return DEFAULT_PLAY_MAP_CENTER;
  }, [cityPlaces, filtered]);

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

  const syncUrl = useCallback(
    (next: Partial<PlayMapQuery>) => {
      const qs = buildPlayMapQueryString({
        city,
        type: typeFilter,
        indoorOnly,
        freeOnly,
        view: browseView,
        ...next,
      });
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [city, typeFilter, indoorOnly, freeOnly, browseView, pathname, router],
  );

  const handleSelectCity = useCallback(
    (nextCity: string | null) => {
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

  const handleToggleThemePark = useCallback(() => {
    const next = typeFilter === "主題樂園" ? null : "主題樂園";
    setTypeFilter(next);
    syncUrl({ type: next });
  }, [typeFilter, syncUrl]);

  const handleNearMe = useCallback(() => {
    if (userLatLng) {
      setUserLatLng(null);
      setGeoStatus("idle");
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLatLng({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setGeoStatus("ready");
      },
      () => {
        setUserLatLng(null);
        setGeoStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [userLatLng]);

  const handleSelectView = useCallback(
    (next: BrowseView) => {
      setBrowseView(next);
      syncUrl({ view: next });
    },
    [syncUrl],
  );

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

  const handleSelect = useCallback(
    (id: string, trigger: HTMLElement, source: SelectSource) => {
      lastTriggerRef.current = trigger;
      setSelectedId(id);
      setSheetVariant(source === "map" ? "compact" : "full");
    },
    [],
  );

  const handleSelectFromCard = useCallback(
    (id: string, trigger: HTMLElement) => {
      handleSelect(id, trigger, "card");
    },
    [handleSelect],
  );

  const handleSelectFromMap = useCallback(
    (id: string, trigger: HTMLElement) => {
      handleSelect(id, trigger, "map");
    },
    [handleSelect],
  );

  const handleCloseSheet = useCallback(() => {
    userClosedSheetRef.current = true;
    setSelectedId(null);
  }, []);

  const handleExpandSheet = useCallback(() => {
    setSheetVariant("full");
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

  useEffect(() => {
    setCity(initialCity);
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

  useEffect(() => {
    if (city === null) return;
    const chip = cityScrollerRef.current?.querySelector<HTMLElement>(
      `[data-city-chip="${city}"]`,
    );
    chip?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [city]);

  const visibleTypeOptions = PLAYGROUND_TYPES.filter((item) => {
    const count = typeCounts.get(item) ?? 0;
    return count > 0 || typeFilter === item;
  });

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

      <section className={styles.intentSection} aria-label="快速意圖">
        <p className={styles.intentLead}>今天想去哪？</p>
        <div className={styles.intentGrid} role="group" aria-label="意圖快捷">
          <button
            type="button"
            className={styles.intentChip}
            aria-pressed={userLatLng !== null}
            aria-busy={geoStatus === "pending"}
            onClick={handleNearMe}
          >
            離我最近
          </button>
          <button
            type="button"
            className={styles.intentChip}
            aria-pressed={freeOnly}
            onClick={handleToggleFree}
          >
            免費放電
          </button>
          <button
            type="button"
            className={styles.intentChip}
            aria-pressed={indoorOnly}
            onClick={handleToggleIndoor}
          >
            室內
          </button>
          <button
            type="button"
            className={styles.intentChip}
            aria-pressed={typeFilter === "主題樂園"}
            onClick={handleToggleThemePark}
          >
            主題樂園
          </button>
        </div>
        {geoStatus === "denied" ? (
          <p className={styles.geoHint} role="status">
            無法定位，已改為免費優先。
          </p>
        ) : null}
        {geoStatus === "pending" ? (
          <p className={styles.geoHint} role="status">
            正在取得位置…
          </p>
        ) : null}
      </section>

      <div className={styles.filtersSticky}>
        <div className={styles.filterSummary} aria-live="polite">
          <p className={styles.filterSummaryText}>{filterSummaryLabel}</p>
          <button
            type="button"
            className={styles.filterToggle}
            aria-expanded={filtersOpen}
            aria-controls="play-map-filter-facets"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            篩選
          </button>
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

        <form
          id="play-map-filter-facets"
          className={styles.filters}
          aria-label="遊樂地點篩選"
          hidden={!filtersOpen}
        >
          <div className={styles.facetRow}>
            <span className={styles.facetLabel}>縣市</span>
            <div
              ref={cityScrollerRef}
              className={styles.chipScroller}
              role="group"
              aria-label="依縣市篩選"
            >
              <button
                type="button"
                data-city-chip="全部"
                className={`${styles.chip} ${styles.chipCompact}`}
                aria-pressed={city === null}
                aria-label={`全部，${allCityCount} 個地點`}
                onClick={() => handleSelectCity(null)}
              >
                {`全部 · ${allCityCount}`}
              </button>
              {cities.map((item) => {
                const count = cityCounts.get(item) ?? 0;
                return (
                  <button
                    key={item}
                    type="button"
                    data-city-chip={item}
                    className={`${styles.chip} ${styles.chipCompact}`}
                    aria-pressed={city === item}
                    aria-label={`${item}，${count} 個地點`}
                    disabled={count === 0 && city !== item}
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
                className={`${styles.chip} ${styles.chipCompact}`}
                aria-pressed={typeFilter === null}
                onClick={() => handleSelectType(null)}
              >
                全部
              </button>
              {visibleTypeOptions.map((item) => {
                const count = typeCounts.get(item) ?? 0;
                const selectedType = typeFilter === item;
                return (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.chip} ${styles.chipCompact}`}
                    aria-pressed={selectedType}
                    aria-label={`${item}，${count} 個地點`}
                    onClick={() => handleSelectType(item)}
                  >
                    {`${item} · ${count}`}
                  </button>
                );
              })}
            </div>
          </div>
        </form>
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
                目前沒有符合條件的地點，試試改意圖或放寬篩選。
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
            命中者依排序輸出；未命中者仍掛 hidden，保留 SSR／索引可發現性。
          */}
          <ul className={styles.cardGrid}>
            {filtered.map((place) => (
              <PlaygroundCard
                key={place.id}
                place={place}
                hidden={false}
                distanceLabel={distanceLabelFor(place, userLatLng)}
                selected={selectedId === place.id}
                onSelect={handleSelectFromCard}
              />
            ))}
            {unmatchedPlaces.map((place) => (
              <PlaygroundCard
                key={`hidden-${place.id}`}
                place={place}
                hidden
                distanceLabel={null}
                selected={false}
                onSelect={handleSelectFromCard}
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
              onSelect={handleSelectFromMap}
              reduceMotion={reduceMotion}
              active={browseView === "map"}
            />
          ) : null}
        </div>
      </div>

      {selected ? (
        <PlayMapSheet
          place={selected}
          variant={sheetVariant}
          onClose={handleCloseSheet}
          onExpand={handleExpandSheet}
          panelRef={sheetRef}
        />
      ) : null}
    </div>
  );
}
