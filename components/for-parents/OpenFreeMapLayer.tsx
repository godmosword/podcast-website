"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

let mapLibreReady: Promise<void> | null = null;

function loadMapLibre(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (!document.querySelector("link[data-maplibre-css]")) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/vendor/maplibre-gl.css";
    link.dataset.maplibreCss = "true";
    document.head.appendChild(link);
  }
  if ((globalThis as { maplibregl?: unknown }).maplibregl) return Promise.resolve();
  if (mapLibreReady) return mapLibreReady;
  mapLibreReady = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = "/vendor/maplibre-entry.mjs";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("MapLibre 載入失敗"));
    document.head.appendChild(script);
  });
  return mapLibreReady;
}

/** OpenFreeMap 公開實例，免註冊、可商業使用。Liberty 為其文件中的街道樣式。 */
export const OPENFREEMAP_STYLE_URL =
  "https://tiles.openfreemap.org/styles/liberty";

/**
 * 替代客戶端必須自行標註。OpenFreeMap 要求：
 * OpenFreeMap © OpenMapTiles Data from OpenStreetMap
 */
export const OPENFREEMAP_ATTRIBUTION =
  '© <a href="https://openfreemap.org/" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

type RemovableLayer = { remove: () => void };

/**
 * 向量圖磚層。MapLibre 的署名控制關掉，改由 Leaflet 署名列顯示同一句。
 */
export default function OpenFreeMapLayer() {
  const map = useMap();

  useEffect(() => {
    let removed = false;
    let layer: RemovableLayer | null = null;
    const attribution = map.attributionControl;
    attribution?.addAttribution(OPENFREEMAP_ATTRIBUTION);
    if (process.env.VITEST) {
      return () => {
        attribution?.removeAttribution(OPENFREEMAP_ATTRIBUTION);
      };
    }

    void (async () => {
      await loadMapLibre();
      const plugin = await import("@maplibre/maplibre-gl-leaflet");
      if (removed) return;
      const created = plugin.maplibreGL({
        style: OPENFREEMAP_STYLE_URL,
        attributionControl: false,
      });
      layer = created.addTo(map);
    })();

    return () => {
      removed = true;
      attribution?.removeAttribution(OPENFREEMAP_ATTRIBUTION);
      layer?.remove();
    };
  }, [map]);

  return null;
}
