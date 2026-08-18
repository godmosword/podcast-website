"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
import {
  CITY_AGGREGATE_MAX_ZOOM,
  INDIVIDUAL_MARKER_MIN_ZOOM,
  clusterPlaygroundsByZoom,
  playMapMarkerMode,
  type CityCluster,
  type SpatialCluster,
} from "@/lib/playground-clusters";
import type { LatLng } from "@/lib/playground-distance";
import { playgroundTypeGlyphSvg } from "@/lib/playground-type-glyph";
import { playgroundTypeVisualKey } from "@/lib/playground-type-visual";
import {
  TAIWAN_MAP_CENTER,
  TAIWAN_MAX_BOUNDS,
  TAIWAN_MAX_BOUNDS_VISCOSITY,
  TAIWAN_NATIONAL_MAX_ZOOM,
  TAIWAN_SOFT_MIN_ZOOM,
  taiwanMapBoundsCorners,
  taiwanNationalView,
} from "@/lib/play-map-camera";
import { pickNearest } from "@/lib/playground-distance";
import { NEAR_ME_FIT_COUNT } from "./PlayMapContract";
import type {
  PlayMapViewportChangeSource,
  PlayMapViewportSnapshot,
} from "./usePlayMapViewport";
import { playMapBoundsKey } from "./usePlayMapViewport";
import styles from "./PlayMap.module.css";

const DEFAULT_ZOOM = 11;

type FitBoundsProps = {
  points: Array<[number, number]>;
  emptyCenter: [number, number];
  animate: boolean;
  selectedPoint: [number, number] | null;
  selectedId: string | null;
  preserveViewport: boolean;
  markProgrammaticCamera: () => void;
  /** 選中時把針抬出 sheet 覆蓋區：[right, bottom] */
  selectedPad: [number, number];
  /** 全國未縮小範圍：用台灣框，不用 fit 縣市聚合點（會把福建放進主畫面）。 */
  nationalFrame: boolean;
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
function InvalidateSizeOnActive({
  active,
  markProgrammaticCamera,
  resizeRequest,
}: {
  active: boolean;
  markProgrammaticCamera: () => void;
  resizeRequest: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!active) return;
    const id = window.requestAnimationFrame(() => {
      markProgrammaticCamera();
      map.invalidateSize();
    });
    return () => window.cancelAnimationFrame(id);
  }, [active, map, markProgrammaticCamera, resizeRequest]);

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
  selectedId,
  preserveViewport,
  markProgrammaticCamera,
  selectedPad,
  nationalFrame,
  fitKey,
}: FitBoundsProps) {
  const map = useMap();
  const snapshotRef = useRef({
    points,
    emptyCenter,
    animate,
    selectedPoint,
    selectedId,
    preserveViewport,
    selectedPad,
    nationalFrame,
  });
  // 無依賴陣列：每次 commit 都寫入最新快照。宣告在主 effect 之前，
  // 同一次 commit 內主 effect 讀到的已是本輪 props。
  useEffect(() => {
    snapshotRef.current = {
      points,
      emptyCenter,
      animate,
      selectedPoint,
      selectedId,
      preserveViewport,
      selectedPad,
      nationalFrame,
    };
  });

  useEffect(() => {
    const snap = snapshotRef.current;
    const motion = snap.animate
      ? undefined
      : ({ animate: false } as L.ZoomPanOptions);

    if (snap.selectedPoint) {
      if (map.getBounds().contains(snap.selectedPoint)) return;
      markProgrammaticCamera();
      map.fitBounds(L.latLngBounds([snap.selectedPoint]), {
        paddingTopLeft: [48, 72],
        paddingBottomRight: snap.selectedPad,
        maxZoom: 15,
        animate: snap.animate,
      });
    } else if (snap.selectedId) {
      // Selected place is currently inside a cluster; keep the selection/Sheet
      // without manufacturing a separate marker or refitting the camera.
      return;
    } else if (snap.preserveViewport) {
      return;
    } else if (snap.nationalFrame) {
      markProgrammaticCamera();
      const applyNational = () => {
        map.invalidateSize();
        const view = taiwanNationalView(map.getSize().x);
        map.setView(view.center, view.zoom, { animate: false });
      };
      applyNational();
      let nestedRaf = 0;
      const raf = window.requestAnimationFrame(() => {
        applyNational();
        nestedRaf = window.requestAnimationFrame(applyNational);
      });
      return () => {
        window.cancelAnimationFrame(raf);
        window.cancelAnimationFrame(nestedRaf);
      };
    } else if (snap.points.length === 0) {
      markProgrammaticCamera();
      map.setView(snap.emptyCenter, DEFAULT_ZOOM, motion);
    } else if (snap.points.length === 1) {
      markProgrammaticCamera();
      map.setView(snap.points[0], 14, motion);
    } else {
      markProgrammaticCamera();
      map.fitBounds(L.latLngBounds(snap.points), {
        paddingTopLeft: [48, 72],
        paddingBottomRight: [48, 48],
        maxZoom: 14,
        animate: snap.animate,
      });
    }
  }, [fitKey, map, markProgrammaticCamera, selectedId]);

  return null;
}

type MapViewportEventsProps = {
  onViewportSettled: (
    snapshot: PlayMapViewportSnapshot,
    source: PlayMapViewportChangeSource,
  ) => void;
  consumeProgrammaticCamera: () => boolean;
};

function MapViewportEvents({
  onViewportSettled,
  consumeProgrammaticCamera,
}: MapViewportEventsProps) {
  const map = useMap();
  const lastSnapshotKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const snapshot = (): PlayMapViewportSnapshot => {
      const bounds = map.getBounds();
      return {
        bounds: {
          south: bounds.getSouth(),
          west: bounds.getWest(),
          north: bounds.getNorth(),
          east: bounds.getEast(),
        },
        zoom: map.getZoom(),
      };
    };
    const report = (source: PlayMapViewportChangeSource) => {
      const next = snapshot();
      const key = `${playMapBoundsKey(next.bounds)}|${next.zoom}`;
      if (source === "user" && key === lastSnapshotKeyRef.current) return;
      lastSnapshotKeyRef.current = key;
      onViewportSettled(next, source);
    };

    // Establish a baseline before the first real user pan/zoom. This is also
    // safe if Leaflet emitted its initial moveend before FitBounds ran.
    report("programmatic");
    const handleSettled = () => {
      report(consumeProgrammaticCamera() ? "programmatic" : "user");
    };
    map.on("moveend", handleSettled);
    map.on("zoomend", handleSettled);
    return () => {
      map.off("moveend", handleSettled);
      map.off("zoomend", handleSettled);
    };
  }, [consumeProgrammaticCamera, map, onViewportSettled]);

  return null;
}

type AccessibleMarkerProps = {
  place: Playground;
  selected: boolean;
  hovered: boolean;
  hoverCorrelationEnabled: boolean;
  onHover: (id: string) => void;
  onBlur: (id: string) => void;
  onSelect: (id: string, trigger: HTMLElement) => void;
};

function markerTrigger(event: L.LeafletMouseEvent): HTMLElement {
  const target = event.originalEvent.target;
  if (target instanceof Element) {
    const button = target.closest("button");
    if (button instanceof HTMLElement) return button;
    if (target instanceof HTMLElement) return target;
  }
  return document.body;
}

const AccessibleMarker = memo(function AccessibleMarker({
  place,
  selected,
  hovered,
  hoverCorrelationEnabled,
  onHover,
  onBlur,
  onSelect,
}: AccessibleMarkerProps) {
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
      html: `<button type="button" class="playMapMarkerButton" data-playground-id="${escapeAttr(place.id)}" data-type="${typeKey}" aria-label="${label}" aria-pressed="${selected ? "true" : "false"}"><span class="playMapPin" aria-hidden="true"><span class="playMapPinGlyph">${playgroundTypeGlyphSvg(typeKey)}</span></span>${nameHtml}</button>`,
      iconSize: [44, 44],
      iconAnchor: [22, 42],
    });
  }, [place.city, place.id, place.name, place.type, selected, typeKey]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const button = marker.getElement()?.querySelector(".playMapMarkerButton");
    if (!(button instanceof HTMLButtonElement)) return;
    button.setAttribute("aria-pressed", selected ? "true" : "false");
    button.dataset.hovered = hovered ? "true" : "false";
  }, [hovered, selected]);

  useEffect(() => {
    if (!hoverCorrelationEnabled) return;
    const button = markerRef.current
      ?.getElement()
      ?.querySelector(".playMapMarkerButton");
    if (!(button instanceof HTMLButtonElement)) return;
    const handleFocus = () => onHover(place.id);
    const handleBlur = () => onBlur(place.id);
    button.addEventListener("focus", handleFocus);
    button.addEventListener("blur", handleBlur);
    return () => {
      button.removeEventListener("focus", handleFocus);
      button.removeEventListener("blur", handleBlur);
    };
  }, [hoverCorrelationEnabled, onBlur, onHover, place.id, selected]);

  const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(() => {
    const handlers: L.LeafletEventHandlerFnMap = {
      click: (event) => onSelect(place.id, markerTrigger(event)),
    };
    if (hoverCorrelationEnabled) {
      handlers.mouseover = () => onHover(place.id);
      handlers.mouseout = () => onBlur(place.id);
    }
    return handlers;
  }, [
    hoverCorrelationEnabled,
    onBlur,
    onHover,
    onSelect,
    place.id,
  ]);

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={icon}
      keyboard={false}
      zIndexOffset={selected ? 1000 : hovered ? 500 : 0}
      eventHandlers={eventHandlers}
    />
  );
});

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

type SpatialClusterMarkerProps = {
  cluster: SpatialCluster;
  animate: boolean;
  markProgrammaticCamera: () => void;
};

function SpatialClusterMarker({
  cluster,
  animate,
  markProgrammaticCamera,
}: SpatialClusterMarkerProps) {
  const map = useMap();
  const icon = useMemo(() => {
    const label = escapeAttr(`此區域有 ${cluster.count} 個親子景點`);
    const count = escapeAttr(String(cluster.count));
    return L.divIcon({
      className: "playMapMarkerHost",
      html: `<button type="button" class="playMapClusterButton playMapSpatialClusterButton" aria-label="${label}"><span class="playMapClusterCount">${count}</span></button>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });
  }, [cluster.count]);

  const eventHandlers = useMemo<L.LeafletEventHandlerFnMap>(
    () => ({
      click: () => {
        markProgrammaticCamera();
        const points = cluster.places.map(
          (place) => [place.lat, place.lng] as [number, number],
        );
        map.fitBounds(L.latLngBounds(points), {
          padding: [48, 48],
          maxZoom: Math.min(15, Math.max(map.getZoom() + 2, 13)),
          animate,
        });
      },
    }),
    [animate, cluster.places, map, markProgrammaticCamera],
  );

  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={icon}
      keyboard={false}
      eventHandlers={eventHandlers}
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
  hoveredPlaceId: string | null;
  hoverCorrelationEnabled: boolean;
  onHover: (id: string) => void;
  onBlur: (id: string) => void;
  onSelect: (id: string, trigger: HTMLElement) => void;
  reduceMotion: boolean;
  active: boolean;
  clusterMode: boolean;
  cityClusters: readonly CityCluster[];
  onSelectCity: (city: string) => void;
  userLatLng: LatLng | null;
  viewportZoom: number | null;
  preserveViewport: boolean;
  onViewportSettled: (
    snapshot: PlayMapViewportSnapshot,
    source: PlayMapViewportChangeSource,
  ) => void;
  /** 面板由 hidden 切回可見時，Leaflet 需重算容器尺寸。 */
  resizeRequest: number;
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
  hoveredPlaceId,
  hoverCorrelationEnabled,
  onHover,
  onBlur,
  onSelect,
  reduceMotion,
  active,
  clusterMode,
  cityClusters,
  onSelectCity,
  userLatLng,
  viewportZoom,
  preserveViewport,
  onViewportSettled,
  resizeRequest,
  splitLayout,
  nearMeCamera,
}: PlayMapLeafletProps) {
  const programmaticCameraRef = useRef(false);
  const programmaticCameraTimerRef = useRef<number | null>(null);
  const markProgrammaticCamera = useCallback(() => {
    programmaticCameraRef.current = true;
    if (programmaticCameraTimerRef.current !== null) {
      window.clearTimeout(programmaticCameraTimerRef.current);
    }
    programmaticCameraTimerRef.current = window.setTimeout(() => {
      programmaticCameraRef.current = false;
      programmaticCameraTimerRef.current = null;
    }, 1_500);
  }, []);
  const consumeProgrammaticCamera = useCallback(() => {
    const marked = programmaticCameraRef.current;
    programmaticCameraRef.current = false;
    if (programmaticCameraTimerRef.current !== null) {
      window.clearTimeout(programmaticCameraTimerRef.current);
      programmaticCameraTimerRef.current = null;
    }
    return marked;
  }, []);
  useEffect(
    () => () => {
      if (programmaticCameraTimerRef.current !== null) {
        window.clearTimeout(programmaticCameraTimerRef.current);
      }
    },
    [],
  );
  const effectiveZoom =
    viewportZoom ??
    (clusterMode ? CITY_AGGREGATE_MAX_ZOOM : INDIVIDUAL_MARKER_MIN_ZOOM);
  const markerMode = playMapMarkerMode({
    nationwideUnscoped: clusterMode,
    zoom: effectiveZoom,
  });
  const spatialClusters = useMemo(
    () =>
      markerMode === "spatial"
        ? clusterPlaygroundsByZoom(places, effectiveZoom)
        : [],
    [effectiveZoom, markerMode, places],
  );
  const visibleSpatialClusters = useMemo(
    () => spatialClusters.filter((cluster) => cluster.count > 1),
    [spatialClusters],
  );
  const spatialSingletons = useMemo(
    () =>
      spatialClusters
        .filter((cluster) => cluster.count === 1)
        .flatMap((cluster) => cluster.places),
    [spatialClusters],
  );
  const visibleIndividualPlaces =
    markerMode === "individual" ? places : spatialSingletons;
  const selected = selectedId
    ? (visibleIndividualPlaces.find((place) => place.id === selectedId) ?? null)
    : null;
  const selectedPoint: [number, number] | null = selected
    ? [selected.lat, selected.lng]
    : null;
  const cityClusterPoints = useMemo(
    (): Array<[number, number]> =>
      cityClusters.map((row) => [row.lat, row.lng]),
    [cityClusters],
  );
  const spatialClusterPoints = useMemo(
    (): Array<[number, number]> => [
      ...visibleSpatialClusters.map(
        (cluster) => [cluster.lat, cluster.lng] as [number, number],
      ),
      ...spatialSingletons.map(
        (place) => [place.lat, place.lng] as [number, number],
      ),
    ],
    [spatialSingletons, visibleSpatialClusters],
  );
  const selectedPad = useMemo(
    (): [number, number] => (splitLayout ? [280, 72] : [48, 120]),
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
  const fitPoints =
    markerMode === "city"
      ? cityClusterPoints
      : markerMode === "spatial"
        ? spatialClusterPoints
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
        center={TAIWAN_MAP_CENTER}
        zoom={TAIWAN_NATIONAL_MAX_ZOOM}
        minZoom={TAIWAN_SOFT_MIN_ZOOM}
        maxBounds={taiwanMapBoundsCorners(TAIWAN_MAX_BOUNDS)}
        maxBoundsViscosity={TAIWAN_MAX_BOUNDS_VISCOSITY}
        scrollWheelZoom={false}
        zoomControl={false}
        aria-label="親子遊樂地點地圖"
      >
        <ZoomControl position="topright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSizeOnActive
          active={active}
          markProgrammaticCamera={markProgrammaticCamera}
          resizeRequest={resizeRequest}
        />
        <MapViewportEvents
          onViewportSettled={onViewportSettled}
          consumeProgrammaticCamera={consumeProgrammaticCamera}
        />
        <FitBounds
          points={fitPoints}
          emptyCenter={emptyCenter}
          animate={!reduceMotion}
          selectedPoint={selectedPoint}
          selectedId={selectedId}
          preserveViewport={preserveViewport}
          markProgrammaticCamera={markProgrammaticCamera}
          selectedPad={selectedPad}
          nationalFrame={clusterMode && selectedId === null && !nearMeCamera}
          fitKey={fitKey}
        />
        {markerMode === "city"
          ? cityClusters.map((cluster) => (
              <ClusterMarker
                key={cluster.city}
                cluster={cluster}
                onSelectCity={(city) => onSelectCity(city)}
              />
            ))
          : markerMode === "spatial"
            ? [
                ...visibleSpatialClusters.map((cluster) => (
                  <SpatialClusterMarker
                    key={cluster.id}
                    cluster={cluster}
                    animate={!reduceMotion}
                    markProgrammaticCamera={markProgrammaticCamera}
                  />
                )),
                ...spatialSingletons.map((place) => (
                  <AccessibleMarker
                    key={place.id}
                    place={place}
                    selected={selectedId === place.id}
                    hovered={hoveredPlaceId === place.id}
                    hoverCorrelationEnabled={hoverCorrelationEnabled}
                    onHover={onHover}
                    onBlur={onBlur}
                    onSelect={onSelect}
                  />
                )),
              ]
            : places.map((place) => (
              <AccessibleMarker
                key={place.id}
                place={place}
                selected={selectedId === place.id}
                hovered={hoveredPlaceId === place.id}
                hoverCorrelationEnabled={hoverCorrelationEnabled}
                onHover={onHover}
                onBlur={onBlur}
                onSelect={onSelect}
              />
            ))}
        {userLatLng ? <MeMarker position={userLatLng} /> : null}
      </MapContainer>

      <p className={styles.mapHint}>
        {markerMode === "city"
          ? "點縣市看該區地點，或先點附近"
          : markerMode === "spatial"
            ? "點區域群組聚焦，或繼續縮放看單點"
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
