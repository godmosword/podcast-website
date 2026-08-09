"use client";

import { useEffect, useMemo, useState } from "react";
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
  listPlaygrounds,
} from "@/data/playgrounds";
import styles from "./PlayMap.module.css";

const DEFAULT_CENTER: [number, number] = [24.9935, 121.301];
const DEFAULT_ZOOM = 11;
const LEAFLET_CDN = "https://unpkg.com/leaflet@1.9.4/dist/images";

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

type FitBoundsProps = {
  points: Array<[number, number]>;
};

function FitBounds({ points }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }
    map.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 14,
    });
  }, [map, points]);

  return null;
}

function formatAgeRange(ageRange: [number, number]): string {
  return `${ageRange[0]}–${ageRange[1]} 歲`;
}

export default function PlayMap() {
  const allPlaces = useMemo(() => [...listPlaygrounds()], []);
  const cities = useMemo(() => listCities(), []);

  const [city, setCity] = useState("全部");
  const [indoorOnly, setIndoorOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return allPlaces.filter((place) => {
      if (city !== "全部" && place.city !== city) return false;
      if (indoorOnly && !place.indoor) return false;
      if (freeOnly && !place.free) return false;
      return true;
    });
  }, [allPlaces, city, indoorOnly, freeOnly]);

  const points = useMemo(
    (): Array<[number, number]> => filtered.map((place) => [place.lat, place.lng]),
    [filtered],
  );

  const selected = selectedId
    ? (filtered.find((place) => place.id === selectedId) ??
      allPlaces.find((place) => place.id === selectedId) ??
      null)
    : null;

  useEffect(() => {
    if (selectedId && !filtered.some((place) => place.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  return (
    <div className={styles.root}>
      <form className={styles.filters} aria-label="遊樂地點篩選">
        <label className={styles.field}>
          <span className={styles.fieldLabel}>城市</span>
          <select
            className={styles.select}
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="依城市篩選"
          >
            <option value="全部">全部</option>
            {cities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={indoorOnly}
            onChange={(event) => setIndoorOnly(event.target.checked)}
          />
          <span>只要室內</span>
        </label>

        <label className={styles.check}>
          <input
            type="checkbox"
            checked={freeOnly}
            onChange={(event) => setFreeOnly(event.target.checked)}
          />
          <span>只要免費</span>
        </label>

        <p className={styles.resultCount} aria-live="polite">
          {filtered.length} 個地點
        </p>
      </form>

      <div className={styles.mapShell}>
        <MapContainer
          className={styles.map}
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          aria-label="親子遊樂地圖"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          {filtered.map((place) => (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              eventHandlers={{
                click: () => setSelectedId(place.id),
              }}
            />
          ))}
        </MapContainer>

        {filtered.length === 0 ? (
          <p className={styles.empty} role="status">
            目前沒有符合條件的地點，試試放寬篩選。
          </p>
        ) : null}
      </div>

      {selected ? (
        <aside
          className={styles.sheet}
          role="dialog"
          aria-modal="false"
          aria-labelledby="play-map-sheet-title"
        >
          <div className={styles.sheetHeader}>
            <h2 id="play-map-sheet-title" className={styles.sheetTitle}>
              {selected.name}
            </h2>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setSelectedId(null)}
              aria-label="關閉地點詳情"
            >
              關閉
            </button>
          </div>

          <p className={styles.meta}>
            {selected.city}
            {selected.district ? ` · ${selected.district}` : ""}
            {" · "}
            {selected.type}
            {" · "}
            {formatAgeRange(selected.ageRange)}
            {" · "}
            {selected.free ? "免費" : "需購票"}
            {" · "}
            {selected.indoor ? "室內" : "戶外"}
          </p>

          {selected.tags.length > 0 ? (
            <ul className={styles.tags}>
              {selected.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          ) : null}

          {selected.tips ? (
            <p className={styles.tips}>
              <span className={styles.tipsLabel}>Tips</span>
              {selected.tips}
            </p>
          ) : null}

          <p className={styles.address}>{selected.address}</p>

          <div className={styles.actions}>
            <a
              className={styles.navButton}
              href={buildGoogleMapsNavUrl(selected.lat, selected.lng)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`開啟 Google 地圖導航前往 ${selected.name}（另開視窗）`}
            >
              開啟 Google 地圖導航
            </a>
            <a
              className={styles.placeLink}
              href={buildGoogleMapsPlaceUrl(selected.lat, selected.lng)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`在 Google 地圖只顯示 ${selected.name} 位置（另開視窗）`}
            >
              只顯示位置
            </a>
            {selected.officialUrl ? (
              <a
                className={styles.officialLink}
                href={selected.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`開啟 ${selected.name} 官網（另開視窗）`}
              >
                官方網站
              </a>
            ) : null}
          </div>
        </aside>
      ) : null}
    </div>
  );
}
