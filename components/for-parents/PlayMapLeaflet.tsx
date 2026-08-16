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
import { playgroundTypeGlyphSvg } from "@/lib/playground-type-glyph";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import { DEFAULT_PLAY_MAP_CENTER } from "@/lib/playground-coverage";
import { pickNearest } from "@/lib/playground-distance";
import { NEAR_ME_FIT_COUNT } from "./PlayMapContract";
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
   * 鏡頭重算的唯一觸發鍵。涵蓋 clusterMode、縣市範圍、命中筆數、selectedId、
   * splitLayout（選中 padding 隨並排／堆疊切換）。
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
  /** 未選縣市且已定位時帶入座標，避免跟全集鏡頭共用同一把鍵。 */
  nearMeToken?: string;
  /** 並排／堆疊會改 selectedPad；跨過 980px 或手機轉橫向時需重算鏡頭。 */
  splitLayout?: boolean;
}): string {
  const cityScope = [...new Set(args.cities)].sort().join(",");
  const near = args.nearMeToken ? `|near:${args.nearMeToken}` : "";
  const split = args.splitLayout ? "|split" : "|stack";
  return `${args.clusterMode ? "cluster" : "pins"}|${cityScope}|${args.filteredCount}|${args.selectedId ?? ""}${near}${split}`;
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

/**
 * 鏡頭只在 fitKey 改變時重算。parent 重繪（載入更多、新的 onSelect 參考等）
 * 不在依賴陣列裡，因此不會把使用者已平移／縮放的視窗拉回去。
 * 不要再加 userMoved／programmatic 旗標：effect 依賴是 [map, fitKey]，
 * MapContainer 生命週期內 map 恆定，fitKey 不變就不會跑；fitKey 一變
 * 本來就該重算。那些旗標在此依賴下是不可達邏輯。
 */
function FitBounds({
  points,
  emptyCenter,
  animate,
  selectedPoint,
  selectedPad,
  fitKey,
}: FitBoundsProps) {
  const map = useMap();
  const snapshotRef = useRef({
    points,
    emptyCenter,
    animate,
    selectedPoint,
    selectedPad,
  });
  // 無依賴陣列：每次 commit 都寫入最新快照。宣告在主 effect 之前，
  // 同一次 commit 內主 effect 讀到的已是本輪 props。
  useEffect(() => {
    snapshotRef.current = {
      points,
      emptyCenter,
      animate,
      selectedPoint,
      selectedPad,
    };
  });

  useEffect(() => {
    const snap = snapshotRef.current;
    const motion = snap.animate
      ? undefined
      : ({ animate: false } as L.ZoomPanOptions);

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
    const label = escapeAttr(`${place.city}，${place.type}，${place.name}`);
    const name = escapeAttr(place.name);
    const nameHtml = selected
      ? `<span class="playMapMarkerName">${name}</span>`
      : "";
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapMarkerButton" data-type="${typeKey}" aria-label="${label}" aria-pressed="${selected ? "true" : "false"}"><span class="playMapPin" aria-hidden="true"><span class="playMapPinGlyph">${playgroundTypeGlyphSvg(typeKey)}</span></span>${nameHtml}</button>`,
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
    const city = escapeAttr(cluster.city);
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapClusterButton" aria-label="${label}"><span class="playMapMarkerName">${city}</span><span class="playMapClusterCount">${count}</span></button>`,
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
  /**
   * 未選縣市且已定位：鏡頭框自己＋最近 N 筆。
   * 針仍畫 `places` 全集。
   */
  nearMeCamera: boolean;
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
  nearMeCamera,
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
  const nearMePoints = useMemo((): Array<[number, number]> | null => {
    if (!nearMeCamera || !userLatLng) return null;
    const nearest = pickNearest(places, userLatLng, NEAR_ME_FIT_COUNT);
    return [
      [userLatLng.lat, userLatLng.lng],
      ...nearest.map((place) => [place.lat, place.lng] as [number, number]),
    ];
  }, [nearMeCamera, places, userLatLng]);
  const fitPoints = clusterMode
    ? clusterPoints
    : (nearMePoints ?? points);
  const fitKey = playMapFitKey({
    clusterMode,
    cities: places.map((place) => place.city),
    filteredCount: places.length,
    selectedId,
    nearMeToken:
      nearMeCamera && userLatLng
        ? `${userLatLng.lat.toFixed(3)},${userLatLng.lng.toFixed(3)}`
        : undefined,
    splitLayout,
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
