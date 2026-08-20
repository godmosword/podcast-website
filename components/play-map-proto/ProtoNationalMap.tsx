"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  collectNamedRects,
  clientRectToBox,
  type NamedRect,
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
import styles from "./ProtoNationalMap.module.css";

export type ProtoMapSample = {
  items: NamedRect[];
  westEdge: number;
  c2Unsolved: readonly string[];
};

export type ProtoNationalMapProps = {
  mode: "A";
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
}: {
  onSample: (sample: ProtoMapSample) => void;
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
        c2Unsolved: [],
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
  }, [map, onSample]);

  return null;
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
      <NationalCamera />
      <MetricsSampler onSample={onSample} />
      {clusters.map((cluster) => (
        <ClusterMarker
          key={cluster.city}
          cluster={cluster}
          onSelectCity={onSelectCity}
        />
      ))}
    </MapContainer>
  );
}
