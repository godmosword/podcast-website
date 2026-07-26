/**
 * 樂園地圖相機目標：pathname 的純函式（M1 不變式）。
 * 點島只改路由；相機是路由的結果，不是原因。
 */
import {
  MAP_STAGE,
  universe,
  worldToStage,
  zoneById,
  type Universe,
} from "@/data/universe";

export type CameraState = { center: [number, number]; zoom: number };

/**
 * 相機目標。刻意做成 discriminated union：世界層**沒有**靜態 center/zoom。
 * 世界層構圖是 viewport 的函式（島群 bbox 中心 @ fitScaleFor），唯一實作在
 * `useMapCamera.reset()`；此處若再宣告一份座標就是第二份真相，兩邊遲早分岔。
 */
export type CameraTarget =
  | { key: "world"; level: "world" }
  | {
      key: `island:${string}`;
      level: "island";
      center: [number, number];
      zoom: number;
    };

export type IslandCameraTarget = Extract<CameraTarget, { level: "island" }>;

const WORLD: CameraTarget = { key: "world", level: "world" };

/** 相機目標是 pathname 的純函式 —— 巢狀導覽核心不變式 */
export function targetFor(pathname: string): CameraTarget {
  const segs = pathname.replace(/^\/adventures\/?/, "").split("/").filter(Boolean);
  if (segs.length === 0) return WORLD;
  const zone = zoneById(segs[0]!);
  if (!zone) return WORLD;
  return {
    key: `island:${zone.id}`,
    level: "island",
    center: zone.camera.center,
    zoom: zone.camera.zoom,
  };
}

export function clamp(s: CameraState, u: Universe = universe): CameraState {
  const zoom = Math.min(u.camera.maxZoom, Math.max(u.camera.minZoom, s.zoom));
  const half = 0.5 / zoom;
  const fit = (v: number) =>
    zoom <= 1 ? 0.5 : Math.min(1 - half, Math.max(half, v));
  return { zoom, center: [fit(s.center[0]), fit(s.center[1])] };
}

/**
 * 將島層 CameraTarget 轉成 useMapCamera.flyTo 所需的 stage px + scale。
 * 只夾 zoom；center 必須對齊島心（勿套用 0–1 viewport clamp，否則邊緣島會被推離）。
 * 舞台邊界仍由 useMapCamera.clampCam 處理。
 *
 * 只吃島層：世界層請走 `useMapCamera.reset()`（傳世界層進來是編譯錯誤）。
 */
export function targetToFlyParams(target: IslandCameraTarget): {
  coord: { x: number; y: number };
  scale: number;
} {
  const zoom = Math.min(
    universe.camera.maxZoom,
    Math.max(universe.camera.minZoom, target.zoom),
  );
  return {
    coord: worldToStage({ x: target.center[0], y: target.center[1] }),
    scale: zoom,
  };
}

/** 是否為島內路徑（含無效 id 時 targetFor 會退回 world）。 */
export function isIslandPath(pathname: string): boolean {
  return targetFor(pathname).level === "island";
}

export { MAP_STAGE, WORLD };
