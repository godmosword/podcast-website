"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  buildGoogleMapsNavUrl,
  buildGoogleMapsPlaceUrl,
  listCities,
  type Playground,
  type PlaygroundSourceKind,
  type PlaygroundType,
} from "@/data/playgrounds";
import { filterPlaygrounds } from "@/lib/playgrounds-query";
import { listCityCoverage } from "@/lib/playground-coverage";
import styles from "./PlayMap.module.css";

const DEFAULT_CENTER: [number, number] = [24.9935, 121.301];
const DEFAULT_ZOOM = 11;
const LEAFLET_CDN = "https://unpkg.com/leaflet@1.9.4/dist/images";

const PLAYGROUND_TYPES: readonly PlaygroundType[] = [
  "公園",
  "室內樂園",
  "博物館",
  "農場",
  "室內放電",
  "其他",
];

const defaultMarkerIcon = L.icon({
  iconUrl: `${LEAFLET_CDN}/marker-icon.png`,
  iconRetinaUrl: `${LEAFLET_CDN}/marker-icon-2x.png`,
  shadowUrl: `${LEAFLET_CDN}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultMarkerIcon;

type BrowseView = "cards" | "map";

type FitBoundsProps = {
  points: Array<[number, number]>;
  animate: boolean;
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

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

/** 面板由 display:none 切回可見時，Leaflet 需重算容器尺寸。 */
function InvalidateSizeOnActive({ active }: { active: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => window.cancelAnimationFrame(id);
  }, [active, map]);

  return null;
}

function FitBounds({ points, animate }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    const motion = animate ? undefined : ({ animate: false } as L.ZoomPanOptions);

    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, motion);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14, motion);
      return;
    }
    map.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 14,
      animate: animate,
    });
  }, [animate, map, points]);

  return null;
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

function typeDataAttr(type: PlaygroundType): string {
  switch (type) {
    case "公園":
      return "park";
    case "室內樂園":
      return "indoor-park";
    case "博物館":
      return "museum";
    case "農場":
      return "farm";
    case "室內放電":
      return "indoor-play";
    case "其他":
      return "other";
  }
}

type AccessibleMarkerProps = {
  place: Playground;
  selected: boolean;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function AccessibleMarker({ place, selected, onSelect }: AccessibleMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  const icon = useMemo(() => {
    const label = escapeAttr(place.name);
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapMarkerButton" aria-label="${label}" aria-pressed="false"></button>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  }, [place.name]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const button = marker.getElement()?.querySelector(".playMapMarkerButton");
    if (!(button instanceof HTMLButtonElement)) return;
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  }, [selected]);

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={icon}
      eventHandlers={{
        click: (event) => {
          const target = event.originalEvent.target;
          if (target instanceof HTMLElement) {
            onSelect(place.id, target);
            return;
          }
          onSelect(place.id, document.body);
        },
      }}
    />
  );
}

type PlayMapSheetProps = {
  place: Playground;
  onClose: () => void;
  panelRef: React.RefObject<HTMLDivElement | null>;
};

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
      tabIndex={-1}
    >
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
          aria-pressed={selected}
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

export default function PlayMap() {
  const cities = useMemo(() => listCities(), []);
  const coverage = useMemo(() => listCityCoverage(), []);
  const reduceMotion = usePrefersReducedMotion();

  const [city, setCity] = useState(() => cities[0] ?? "");
  const [typeFilter, setTypeFilter] = useState<PlaygroundType | null>(null);
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [browseView, setBrowseView] = useState<BrowseView>("cards");

  const lastTriggerRef = useRef<HTMLElement | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
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

  const points = useMemo(
    (): Array<[number, number]> => filtered.map((place) => [place.lat, place.lng]),
    [filtered],
  );

  const selected = selectedId
    ? (filtered.find((place) => place.id === selectedId) ?? null)
    : null;

  const cityCoverage = coverage.find((row) => row.city === city);

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

  const resultLabel =
    filtered.length === 0
      ? "目前沒有符合條件的地點"
      : `找到 ${filtered.length} 個地點`;

  return (
    <div className={styles.root}>
      <header className={styles.toolbar}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>親子遊樂地圖</h1>
          <p className={styles.coverage}>
            北北基桃與竹苗中彰投雲已上線
            {cityCoverage ? ` · ${cityCoverage.city} ${cityCoverage.count} 處` : ""}
          </p>
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

        <p className={styles.resultCount} aria-live="polite">
          {resultLabel}
        </p>
      </header>

      <form className={styles.filters} aria-label="遊樂地點篩選">
        <div className={styles.facetRow}>
          <span className={styles.facetLabel}>縣市</span>
          <div
            className={styles.chipScroller}
            role="group"
            aria-label="依縣市篩選"
          >
            {cities.map((item) => (
              <button
                key={item}
                type="button"
                className={styles.chip}
                aria-pressed={city === item}
                onClick={() => setCity(item)}
              >
                {item}
              </button>
            ))}
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

      <div className={styles.content}>
        <section
          id="play-map-panel-cards"
          role="tabpanel"
          aria-labelledby="play-map-tab-cards"
          aria-label="卡片"
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
          aria-label="地圖"
          hidden={browseView !== "map"}
          className={styles.mapShell}
        >
          {browseView === "map" ? (
            <>
              <MapContainer
                className={styles.map}
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom={false}
                aria-label="親子遊樂地點地圖"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <InvalidateSizeOnActive active={browseView === "map"} />
                <FitBounds points={points} animate={!reduceMotion} />
                {filtered.map((place) => (
                  <AccessibleMarker
                    key={place.id}
                    place={place}
                    selected={selectedId === place.id}
                    onSelect={handleSelect}
                  />
                ))}
              </MapContainer>

              <p className={styles.mapHint}>雙指或工具列可縮放</p>

              {filtered.length === 0 ? (
                <p className={styles.empty} role="status">
                  目前沒有符合條件的地點，試試放寬篩選。
                </p>
              ) : null}
            </>
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
