"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import L from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  collectNamedRects,
  clientRectToBox,
  type ProtoMapSample,
} from "@/lib/play-map-proto-metrics";
import {
  TAIWAN_MAP_CENTER,
  TAIWAN_MAX_BOUNDS,
  TAIWAN_MAX_BOUNDS_VISCOSITY,
  TAIWAN_NATIONAL_MAX_ZOOM,
  TAIWAN_SOFT_MIN_ZOOM,
  taiwanMapBoundsCorners,
  taiwanNationalView,
} from "@/lib/play-map-camera";
import {
  clusterPlaygroundsByCity,
  type CityCluster,
} from "@/lib/playground-clusters";
import {
  clusterPlaygroundsByCityBbox,
  displaceCityMarkers,
  type C2Layout,
} from "@/lib/play-map-proto-c2";
import { nationalWebMercatorProjector } from "@/lib/play-map-proto-project";
import styles from "./ProtoNationalMap.module.css";

export type ProtoNationalMapProps = {
  mode: "A" | "C2";
  onSelectCity: (next: string | null) => void;
  onSample: (sample: ProtoMapSample) => void;
};

function escapeAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/** 與 production ClusterMarker 相同的 html／iconSize／iconAnchor。 */
export function protoCityClusterIconHtml(cluster: CityCluster): string {
  const label = escapeAttr(`${cluster.city}，${cluster.count} 處`);
  const count = escapeAttr(String(cluster.count));
  const city = escapeAttr(cluster.city);
  return `<button type="button" class="playMapClusterButton" data-proto-entrance data-city="${city}" aria-label="${label}"><span class="playMapMarkerName">${city}</span><span class="playMapClusterCount">${count}</span></button>`;
}

function NationalCamera() {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      map.invalidateSize();
      const view = taiwanNationalView(map.getSize().x);
      map.setView(view.center, view.zoom, { animate: false });
    };
    apply();
    let nested = 0;
    const raf = window.requestAnimationFrame(() => {
      apply();
      nested = window.requestAnimationFrame(apply);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(nested);
    };
  }, [map]);

  return null;
}

function MetricsSampler({
  onSample,
  c2Unsolved,
}: {
  onSample: (sample: ProtoMapSample) => void;
  c2Unsolved: readonly string[];
}) {
  const map = useMap();

  useEffect(() => {
    const sample = () => {
      const root = map.getContainer();
      const items = collectNamedRects(
        root,
        clientRectToBox(root.getBoundingClientRect()),
      );
      onSample({
        items,
        westEdge: map.getBounds().getWest(),
        c2Unsolved,
      });
    };

    const run = () => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(sample);
      });
    };

    map.whenReady(run);
    map.on("moveend", run);
    const observer = new MutationObserver(run);
    observer.observe(map.getContainer(), { childList: true, subtree: true });
    return () => {
      map.off("moveend", run);
      observer.disconnect();
    };
  }, [c2Unsolved, map, onSample]);

  return null;
}

function C2Layers({
  onSelectCity,
  onSample,
}: {
  onSelectCity: (next: string | null) => void;
  onSample: (sample: ProtoMapSample) => void;
}) {
  const map = useMap();
  const [layout, setLayout] = useState<C2Layout | null>(null);

  useEffect(() => {
    const applyCamera = () => {
      map.invalidateSize();
      const view = taiwanNationalView(map.getSize().x);
      map.setView(view.center, view.zoom, { animate: false });
    };
    const compute = () => {
      applyCamera();
      const size = map.getSize();
      setLayout(
        displaceCityMarkers({
          clusters: clusterPlaygroundsByCityBbox(listPlaygrounds()),
          width: size.x,
          height: size.y,
          projector: nationalWebMercatorProjector(size.x, size.y),
        }),
      );
    };
    applyCamera();
    let nested = 0;
    const raf = window.requestAnimationFrame(() => {
      compute();
      nested = window.requestAnimationFrame(compute);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      window.cancelAnimationFrame(nested);
    };
  }, [map]);

  if (!layout) return null;

  return (
    <>
      <MetricsSampler onSample={onSample} c2Unsolved={layout.unsolved} />
      {layout.markers.map((marker) =>
        marker.leaderPx > 1 ? (
          <Fragment key={`leader-${marker.city}`}>
            <Polyline
              positions={[
                [marker.trueLat, marker.trueLng],
                [marker.displayLat, marker.displayLng],
              ]}
              pathOptions={{
                color: "#34302b",
                weight: 1,
                opacity: 0.55,
              }}
              interactive={false}
            />
            <CircleMarker
              center={[marker.trueLat, marker.trueLng]}
              radius={3}
              pathOptions={{
                color: "#34302b",
                fillColor: "#34302b",
                fillOpacity: 0.9,
                weight: 1,
              }}
              interactive={false}
            />
          </Fragment>
        ) : null,
      )}
      {layout.markers.map((marker) => (
        <ClusterMarker
          key={marker.city}
          cluster={{
            city: marker.city,
            count: marker.count,
            lat: marker.displayLat,
            lng: marker.displayLng,
          }}
          onSelectCity={onSelectCity}
        />
      ))}
    </>
  );
}

function ClusterMarker({
  cluster,
  onSelectCity,
}: {
  cluster: CityCluster;
  onSelectCity: (next: string | null) => void;
}) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: `playMapMarkerHost ${styles.markerHost}`,
        html: protoCityClusterIconHtml(cluster),
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      }),
    [cluster],
  );

  return (
    <Marker
      position={[cluster.lat, cluster.lng]}
      icon={icon}
      keyboard={false}
      eventHandlers={{
        click: () => onSelectCity(cluster.city),
      }}
    />
  );
}

export default function ProtoNationalMap({
  mode,
  onSelectCity,
  onSample,
}: ProtoNationalMapProps) {
  const clusters = useMemo(
    () => clusterPlaygroundsByCity(listPlaygrounds()),
    [],
  );

  return (
    <MapContainer
      className={styles.map}
      center={TAIWAN_MAP_CENTER}
      zoom={TAIWAN_NATIONAL_MAX_ZOOM}
      minZoom={TAIWAN_SOFT_MIN_ZOOM}
      maxBounds={taiwanMapBoundsCorners(TAIWAN_MAX_BOUNDS)}
      maxBoundsViscosity={TAIWAN_MAX_BOUNDS_VISCOSITY}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      dragging={false}
      zoomControl={false}
      keyboard={false}
      attributionControl
      aria-label="全國縣市聚合地圖（prototype）"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {mode === "C2" ? (
        <C2Layers onSelectCity={onSelectCity} onSample={onSample} />
      ) : (
        <>
          <NationalCamera />
          <MetricsSampler onSample={onSample} c2Unsolved={[]} />
          {clusters.map((cluster) => (
            <ClusterMarker
              key={cluster.city}
              cluster={cluster}
              onSelectCity={onSelectCity}
            />
          ))}
        </>
      )}
    </MapContainer>
  );
}
