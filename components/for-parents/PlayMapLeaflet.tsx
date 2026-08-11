"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Playground } from "@/data/playgrounds";
import { DEFAULT_PLAY_MAP_CENTER } from "@/lib/playground-coverage";
import styles from "./PlayMap.module.css";

const DEFAULT_ZOOM = 11;

type FitBoundsProps = {
  points: Array<[number, number]>;
  emptyCenter: [number, number];
  animate: boolean;
};

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

function FitBounds({ points, emptyCenter, animate }: FitBoundsProps) {
  const map = useMap();

  useEffect(() => {
    const motion = animate ? undefined : ({ animate: false } as L.ZoomPanOptions);

    if (points.length === 0) {
      map.setView(emptyCenter, DEFAULT_ZOOM, motion);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0], 14, motion);
      return;
    }
    map.fitBounds(L.latLngBounds(points), {
      // 頂部多留一點：置頂導覽列可能疊在地圖上緣，避免最北標記貼邊。
      paddingTopLeft: [48, 72],
      paddingBottomRight: [48, 48],
      maxZoom: 14,
      animate: animate,
    });
  }, [animate, emptyCenter, map, points]);

  return null;
}

type AccessibleMarkerProps = {
  place: Playground;
  selected: boolean;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function AccessibleMarker({ place, selected, onSelect }: AccessibleMarkerProps) {
  const markerRef = useRef<L.Marker>(null);

  const icon = useMemo(() => {
    const label = escapeAttr(`${place.city} · ${place.type} · ${place.name}`);
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapMarkerButton" aria-label="${label}" aria-pressed="false"></button>`,
      iconSize: [44, 44],
      iconAnchor: [22, 44],
    });
  }, [place.city, place.name, place.type]);

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
      // Leaflet 預設會給 marker 外層 host 加上 tabindex／role=button，
      // 與 divIcon 內的真實 <button> 形成巢狀互動元素（axe nested-interactive）。
      // 關閉後只留內層 button 可聚焦；Enter 觸發的 click 仍會冒泡到 Leaflet handler。
      keyboard={false}
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

export type PlayMapLeafletProps = {
  places: Playground[];
  points: Array<[number, number]>;
  emptyCenter: [number, number];
  selectedId: string | null;
  onSelect: (id: string, trigger: HTMLElement) => void;
  reduceMotion: boolean;
  active: boolean;
};

export default function PlayMapLeaflet({
  places,
  points,
  emptyCenter,
  selectedId,
  onSelect,
  reduceMotion,
  active,
}: PlayMapLeafletProps) {
  return (
    <>
      <MapContainer
        className={styles.map}
        center={DEFAULT_PLAY_MAP_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        zoomControl={false}
        aria-label="親子遊樂地點地圖"
      >
        {/*
          預設 topleft 會被置頂導覽列蓋住；右下則會被地點詳情面板（桌面固定於右下）
          與 OSM attribution 佔用，因此放左下。
        */}
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSizeOnActive active={active} />
        <FitBounds
          points={points}
          emptyCenter={emptyCenter}
          animate={!reduceMotion}
        />
        {places.map((place) => (
          <AccessibleMarker
            key={place.id}
            place={place}
            selected={selectedId === place.id}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>

      <p className={styles.mapHint}>雙指或工具列可縮放</p>

      {places.length === 0 ? (
        <p className={styles.empty} role="status">
          目前沒有符合條件的地點，試試放寬篩選。
        </p>
      ) : null}
    </>
  );
}
