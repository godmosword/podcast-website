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
import type { CityCluster } from "@/lib/playground-clusters";
import type { LatLng } from "@/lib/playground-distance";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import { DEFAULT_PLAY_MAP_CENTER } from "@/lib/playground-coverage";
import styles from "./PlayMap.module.css";

const DEFAULT_ZOOM = 11;

type FitBoundsProps = {
  points: Array<[number, number]>;
  emptyCenter: [number, number];
  animate: boolean;
  selectedPoint: [number, number] | null;
  /** 選中時把針抬出 sheet 覆蓋區：[right, bottom] */
  selectedPad: [number, number];
  /**
   * 鏡頭重算的唯一觸發鍵。涵蓋 clusterMode、縣市範圍、命中筆數、selectedId。
   * 其餘鏡頭參數由 ref 讀最新快照，避免 parent 重繪把使用者平移／縮放拉回去。
   */
  fitKey: string;
};

/** 組出 FitBounds 的 fitKey；城市名排序後拼接，避免集合相同但順序不同。 */
export function playMapFitKey(args: {
  clusterMode: boolean;
  cities: readonly string[];
  filteredCount: number;
  selectedId: string | null;
}): string {
  const cityScope = [...new Set(args.cities)].sort().join(",");
  return `${args.clusterMode ? "cluster" : "pins"}|${cityScope}|${args.filteredCount}|${args.selectedId ?? ""}`;
}

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

function FitBounds({
  points,
  emptyCenter,
  animate,
  selectedPoint,
  selectedPad,
  fitKey,
}: FitBoundsProps) {
  const map = useMap();
  const userMovedRef = useRef(false);
  const programmaticRef = useRef(false);
  const prevFitKeyRef = useRef<string | undefined>(undefined);
  const snapshotRef = useRef({
    points,
    emptyCenter,
    animate,
    selectedPoint,
    selectedPad,
  });
  snapshotRef.current = {
    points,
    emptyCenter,
    animate,
    selectedPoint,
    selectedPad,
  };

  useEffect(() => {
    const markUserMoved = () => {
      if (programmaticRef.current) return;
      userMovedRef.current = true;
    };
    map.on("dragstart", markUserMoved);
    map.on("zoomstart", markUserMoved);
    return () => {
      map.off("dragstart", markUserMoved);
      map.off("zoomstart", markUserMoved);
    };
  }, [map]);

  useEffect(() => {
    const keyChanged = prevFitKeyRef.current !== fitKey;
    prevFitKeyRef.current = fitKey;

    if (userMovedRef.current && !keyChanged) {
      return;
    }
    if (keyChanged) {
      userMovedRef.current = false;
    }

    const snap = snapshotRef.current;
    const motion = snap.animate
      ? undefined
      : ({ animate: false } as L.ZoomPanOptions);

    programmaticRef.current = true;
    if (snap.selectedPoint) {
      map.fitBounds(L.latLngBounds([snap.selectedPoint]), {
        paddingTopLeft: [48, 72],
        paddingBottomRight: snap.selectedPad,
        maxZoom: 15,
        animate: snap.animate,
      });
    } else if (snap.points.length === 0) {
      map.setView(snap.emptyCenter, DEFAULT_ZOOM, motion);
    } else if (snap.points.length === 1) {
      map.setView(snap.points[0], 14, motion);
    } else {
      map.fitBounds(L.latLngBounds(snap.points), {
        paddingTopLeft: [48, 72],
        paddingBottomRight: [48, 48],
        maxZoom: 14,
        animate: snap.animate,
      });
    }
    // fitBounds／setView 會同步（或下一幀）發 zoomstart；延後清旗標避免誤判成使用者操作。
    const raf = window.requestAnimationFrame(() => {
      programmaticRef.current = false;
    });
    return () => {
      window.cancelAnimationFrame(raf);
      programmaticRef.current = false;
    };
  }, [map, fitKey]);

  return null;
}

type AccessibleMarkerProps = {
  place: Playground;
  selected: boolean;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function AccessibleMarker({ place, selected, onSelect }: AccessibleMarkerProps) {
  const markerRef = useRef<L.Marker>(null);
  const typeKey = playgroundTypeVisualKey(place.type);

  const icon = useMemo(() => {
    const label = escapeAttr(`${place.city} · ${place.type} · ${place.name}`);
    const name = escapeAttr(place.name);
    const nameHtml = selected
      ? `<span class="playMapMarkerName">${name}</span>`
      : "";
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapMarkerButton" data-type="${typeKey}" aria-label="${label}" aria-pressed="${selected ? "true" : "false"}"><span class="playMapPin" aria-hidden="true"></span>${nameHtml}</button>`,
      iconSize: [44, 44],
      iconAnchor: [22, 42],
    });
  }, [place.city, place.name, place.type, selected, typeKey]);

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

type ClusterMarkerProps = {
  cluster: CityCluster;
  onSelectCity: (city: string, trigger: HTMLElement) => void;
};

function ClusterMarker({ cluster, onSelectCity }: ClusterMarkerProps) {
  const icon = useMemo(() => {
    const label = escapeAttr(`${cluster.city}，${cluster.count} 處`);
    const count = escapeAttr(String(cluster.count));
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapClusterButton" aria-label="${label}"><span class="playMapClusterCount">${count}</span></button>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });
  }, [cluster.city, cluster.count]);

  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={icon}
      keyboard={false}
      eventHandlers={{
        click: (event) => {
          const target = event.originalEvent.target;
          if (target instanceof HTMLElement) {
            onSelectCity(cluster.city, target);
            return;
          }
          onSelectCity(cluster.city, document.body);
        },
      }}
    />
  );
}

type MeMarkerProps = {
  position: LatLng;
};

function MeMarker({ position }: MeMarkerProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "playMapMarkerHost",
        html: `<span class="playMapMeMarker" role="img" aria-label="你目前的位置"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    [],
  );

  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={icon}
      keyboard={false}
      interactive={false}
      zIndexOffset={600}
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
  clusterMode: boolean;
  cityClusters: readonly CityCluster[];
  onSelectCity: (city: string) => void;
  userLatLng: LatLng | null;
  /** 桌面並排時 sheet 在右側，padding 改偏右。 */
  splitLayout: boolean;
};

export default function PlayMapLeaflet({
  places,
  points,
  emptyCenter,
  selectedId,
  onSelect,
  reduceMotion,
  active,
  clusterMode,
  cityClusters,
  onSelectCity,
  userLatLng,
  splitLayout,
}: PlayMapLeafletProps) {
  const selected = selectedId
    ? (places.find((place) => place.id === selectedId) ?? null)
    : null;
  const selectedPoint: [number, number] | null = selected
    ? [selected.lat, selected.lng]
    : null;
  const clusterPoints = useMemo(
    (): Array<[number, number]> =>
      cityClusters.map((row) => [row.lat, row.lng]),
    [cityClusters],
  );
  const selectedPad = useMemo(
    (): [number, number] => (splitLayout ? [280, 72] : [48, 220]),
    [splitLayout],
  );
  const fitPoints = clusterMode ? clusterPoints : points;
  const fitKey = playMapFitKey({
    clusterMode,
    cities: places.map((place) => place.city),
    filteredCount: places.length,
    selectedId,
  });

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
        <ZoomControl position="bottomleft" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSizeOnActive active={active} />
        <FitBounds
          points={fitPoints}
          emptyCenter={emptyCenter}
          animate={!reduceMotion}
          selectedPoint={clusterMode ? null : selectedPoint}
          selectedPad={selectedPad}
          fitKey={fitKey}
        />
        {clusterMode
          ? cityClusters.map((cluster) => (
              <ClusterMarker
                key={cluster.city}
                cluster={cluster}
                onSelectCity={(city) => onSelectCity(city)}
              />
            ))
          : places.map((place) => (
              <AccessibleMarker
                key={place.id}
                place={place}
                selected={selectedId === place.id}
                onSelect={onSelect}
              />
            ))}
        {userLatLng ? <MeMarker position={userLatLng} /> : null}
      </MapContainer>

      <p className={styles.mapHint}>
        {clusterMode
          ? "點縣市看該區地點，或先點離我最近"
          : "雙指或工具列可縮放"}
      </p>

      {fitPoints.length === 0 ? (
        <p className={styles.empty} role="status">
          目前沒有符合條件的地點，試試放寬篩選。
        </p>
      ) : null}
    </>
  );
}
