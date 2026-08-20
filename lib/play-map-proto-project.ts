/**
 * 全國鏡頭下的 Web Mercator 投影，對齊 Leaflet EPSG:3857 與 taiwanNationalView。
 */
import { taiwanNationalView } from "@/lib/play-map-camera";

const TILE = 256;

export type Point = { x: number; y: number };
export type LatLng = { lat: number; lng: number };

export type PointProjector = {
  toPoint: (lat: number, lng: number) => Point;
  toLatLng: (x: number, y: number) => LatLng;
};

export function mercatorX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * TILE * 2 ** zoom;
}

export function mercatorY(lat: number, zoom: number): number {
  const clamped = Math.max(-85.05, Math.min(85.05, lat));
  const sin = Math.sin((clamped * Math.PI) / 180);
  return (
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * TILE * 2 ** zoom
  );
}

export function mercatorXToLng(x: number, zoom: number): number {
  return (x / (TILE * 2 ** zoom)) * 360 - 180;
}

export function mercatorYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / (TILE * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

/** 與 production 全國鏡頭相同：固定 z=8、西緣釘 120.35。 */
export function nationalWebMercatorProjector(
  width: number,
  height: number,
): PointProjector {
  const view = taiwanNationalView(width);
  const zoom = view.zoom;
  const originX = mercatorX(view.center[1], zoom);
  const originY = mercatorY(view.center[0], zoom);
  return {
    toPoint: (lat, lng) => ({
      x: width / 2 + (mercatorX(lng, zoom) - originX),
      y: height / 2 + (mercatorY(lat, zoom) - originY),
    }),
    toLatLng: (x, y) => ({
      lat: mercatorYToLat(originY + (y - height / 2), zoom),
      lng: mercatorXToLng(originX + (x - width / 2), zoom),
    }),
  };
}
