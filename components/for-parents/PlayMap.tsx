"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  listCities,
  type Playground,
  type PlaygroundSourceKind,
  type PlaygroundType,
} from "@/data/playgrounds";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
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

const PLAYGROUND_TYPES: readonly PlaygroundType[] = [
  "公園",
  "室內樂園",
  "主題樂園",
  "博物館",
  "農場",
  "其他",
];

type BrowseView = "cards" | "map";

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
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function PlaygroundCard({ place, selected, onSelect }: PlaygroundCardProps) {
  return (
    <li>
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
  /** Server 預算預設縣市卡片，供 SSR 首屏對齊（client 以 filterPlaygrounds 重算）。 */
  initialPlaces?: Playground[];
};

export default function PlayMap({
  defaultCity = DEFAULT_PLAY_MAP_CITY,
  initialPlaces,
}: PlayMapProps) {
  const cities = useMemo(() => listCities(), []);
  const coverage = useMemo(() => listCityCoverage(), []);
  const reduceMotion = usePrefersReducedMotion();

  const [city, setCity] = useState(defaultCity);
  const [typeFilter, setTypeFilter] = useState<PlaygroundType | null>(null);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [browseView, setBrowseView] = useState<BrowseView>("cards");

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const userClosedSheetRef = useRef(false);

  const pristineDefaults =
    city === defaultCity &&
    typeFilter === null &&
    !indoorOnly &&
    !freeOnly &&
    initialPlaces !== undefined;

  const filtered = useMemo(
    () =>
      pristineDefaults
        ? [...initialPlaces]
        : filterPlaygrounds({
            city,
            indoorOnly,
            freeOnly,
            type: typeFilter ?? undefined,
          }),
    [
      pristineDefaults,
      initialPlaces,
      city,
      indoorOnly,
      freeOnly,
      typeFilter,
    ],
  );

  const points = useMemo(
    (): Array<[number, number]> => filtered.map((place) => [place.lat, place.lng]),
    [filtered],
  );

  const selected = selectedId
    ? (filtered.find((place) => place.id === selectedId) ?? null)
    : null;

  const coverageByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of coverage) {
      map.set(row.city, row.count);
    }
    return map;
  }, [coverage]);

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

  const handleClearFilters = useCallback(() => {
    setTypeFilter(null);
    setIndoorOnly(false);
    setFreeOnly(false);
  }, []);

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
        >
          <button
            type="button"
            role="tab"
            id="play-map-tab-cards"
            aria-selected={browseView === "cards"}
            aria-controls="play-map-panel-cards"
            className={[
              styles.viewTab,
              browseView === "cards" ? styles.viewTabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setBrowseView("cards")}
          >
            卡片
          </button>
          <button
            type="button"
            role="tab"
            id="play-map-tab-map"
            aria-selected={browseView === "map"}
            aria-controls="play-map-panel-map"
            className={[
              styles.viewTab,
              browseView === "map" ? styles.viewTabActive : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setBrowseView("map")}
          >
            地圖
          </button>
        </div>

      </header>

      <form className={styles.filters} aria-label="遊樂地點篩選">
        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>縣市</span>
          <div
            className={styles.chipScroller}
            role="group"
            aria-label="依縣市篩選"
          >
            {cities.map((item) => {
              const count = coverageByCity.get(item);
              const label =
                count !== undefined ? `${item} · ${count}` : item;
              return (
                <button
                  key={item}
                  type="button"
                  className={styles.chip}
                  aria-pressed={city === item}
                  onClick={() => setCity(item)}
                >
                  {label}
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
              onClick={() => setTypeFilter(null)}
            >
              全部
            </button>
            {PLAYGROUND_TYPES.map((item) => (
              <button
                key={item}
                type="button"
                className={styles.chip}
                aria-pressed={typeFilter === item}
                onClick={() => setTypeFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chipGroup} role="group" aria-label="進階篩選">
          <button
            type="button"
            className={styles.chip}
            aria-pressed={indoorOnly}
            onClick={() => setIndoorOnly((value) => !value)}
          >
            室內
          </button>
          <button
            type="button"
            className={styles.chip}
            aria-pressed={freeOnly}
            onClick={() => setFreeOnly((value) => !value)}
          >
            免費
          </button>
        </div>
      </form>

      <div className={styles.filterSummary} aria-live="polite">
        <p className={styles.filterSummaryText}>{filterSummaryLabel}</p>
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

      <div className={styles.content}>
        <section
          id="play-map-panel-cards"
          role="tabpanel"
          aria-labelledby="play-map-tab-cards"
          hidden={browseView !== "cards"}
          className={styles.cardsPanel}
        >
          {filtered.length === 0 ? (
            <p className={styles.listEmpty} role="status">
              目前沒有符合條件的地點，試試放寬篩選。
            </p>
          ) : (
            <ul className={styles.cardGrid}>
              {filtered.map((place) => (
                <PlaygroundCard
                  key={place.id}
                  place={place}
                  selected={selectedId === place.id}
                  onSelect={handleSelect}
                />
              ))}
            </ul>
          )}
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
