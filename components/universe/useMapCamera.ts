"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAP_STAGE, ZONES, type ZoneCoord } from "@/data/universe-zones";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const MIN_SCALE = 0.34;
const MAX_SCALE = 2.4;
/** 允許少量 overscroll，讓拖曳手感不死板。 */
const OVERSCROLL = 48;
/** fly-to 過場時間（毫秒），與 CSS transition 對齊。 */
export const FLY_DURATION_MS = 600;
/** 預設鏡頭比 fit 再退一點，讓視差天空層（雲／遠島）從世界邊緣探出來。 */
const FIT_MARGIN = 0.88;
/** 進場降落動畫：起始鏡頭相對 fit 的倍率（從高空俯瞰整個群島再飛向主島）。 */
const ENTRY_START_FACTOR = 0.55;
/** 每個分頁 session 只播一次進場動畫，回訪不重播。 */
const ENTRY_PLAYED_KEY = "cc-universe-entry-played";

type Camera = { scale: number; tx: number; ty: number };

const CAR_PARK =
  ZONES.find((z) => z.id === "car-park")?.coord ?? { x: 500, y: 400 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function clampScale(scale: number): number {
  return clamp(scale, MIN_SCALE, MAX_SCALE);
}

export type MapCameraBind = {
  ref: (el: HTMLDivElement | null) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export type MapCamera = {
  scale: number;
  tx: number;
  ty: number;
  isAnimating: boolean;
  bind: MapCameraBind;
  flyTo: (coord: ZoneCoord, targetScale?: number) => void;
  reset: () => void;
  zoomBy: (delta: number) => void;
};

export function useMapCamera(): MapCamera {
  const reduced = useReducedMotion();
  const [cam, setCam] = useState<Camera>({ scale: 1, tx: 0, ty: 0 });
  const [animating, setAnimating] = useState(false);
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);

  const sizeRef = useRef({ w: 0, h: 0 });
  const initializedRef = useRef(false);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const prevPinchRef = useRef<{ dist: number } | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clampCam = useCallback((next: Camera): Camera => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return next;
    const stageW = MAP_STAGE.width * next.scale;
    const stageH = MAP_STAGE.height * next.scale;

    let tx = next.tx;
    let ty = next.ty;

    if (stageW + OVERSCROLL * 2 <= w) {
      tx = (w - stageW) / 2;
    } else {
      tx = clamp(tx, w - stageW - OVERSCROLL, OVERSCROLL);
    }
    if (stageH + OVERSCROLL * 2 <= h) {
      ty = (h - stageH) / 2;
    } else {
      ty = clamp(ty, h - stageH - OVERSCROLL, OVERSCROLL);
    }
    return { scale: next.scale, tx, ty };
  }, []);

  const zoomAt = useCallback(
    (factor: number, focusX: number, focusY: number) => {
      setCam((c) => {
        const ns = clampScale(c.scale * factor);
        const realFactor = ns / c.scale;
        const tx = focusX - (focusX - c.tx) * realFactor;
        const ty = focusY - (focusY - c.ty) * realFactor;
        return clampCam({ scale: ns, tx, ty });
      });
    },
    [clampCam],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setCam((c) => clampCam({ scale: c.scale, tx: c.tx + dx, ty: c.ty + dy }));
    },
    [clampCam],
  );

  const flyTo = useCallback(
    (coord: ZoneCoord, targetScale?: number) => {
      setCam((c) => {
        const { w, h } = sizeRef.current;
        if (w === 0 || h === 0) return c;
        const ns = clampScale(targetScale ?? c.scale);
        const tx = w / 2 - coord.x * ns;
        const ty = h / 2 - coord.y * ns;
        return clampCam({ scale: ns, tx, ty });
      });
      if (reduced) return;
      setAnimating(true);
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      animTimerRef.current = setTimeout(
        () => setAnimating(false),
        FLY_DURATION_MS,
      );
    },
    [clampCam, reduced],
  );

  const fitScale = useCallback((): number => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return 1;
    return clampScale(
      Math.min(w / MAP_STAGE.width, h / MAP_STAGE.height) * FIT_MARGIN,
    );
  }, []);

  const reset = useCallback(() => {
    flyTo(CAR_PARK, fitScale());
  }, [flyTo, fitScale]);

  const zoomBy = useCallback(
    (delta: number) => {
      const { w, h } = sizeRef.current;
      zoomAt(1 + delta, w / 2, h / 2);
    },
    [zoomAt],
  );

  // 量測 viewport 尺寸 + 首次置中 car-park。
  useEffect(() => {
    if (!viewportEl) return;
    const measure = () => {
      const rect = viewportEl.getBoundingClientRect();
      sizeRef.current = { w: rect.width, h: rect.height };
      if (rect.width === 0 || rect.height === 0) return;
      if (!initializedRef.current) {
        initializedRef.current = true;
        const ns = clampScale(
          Math.min(rect.width / MAP_STAGE.width, rect.height / MAP_STAGE.height) *
            FIT_MARGIN,
        );

        // 進場降落：首次進園從高空俯瞰整個群島，再飛向主島（每 session 一次）。
        let playEntry = false;
        if (!reduced) {
          try {
            playEntry = !sessionStorage.getItem(ENTRY_PLAYED_KEY);
            if (playEntry) sessionStorage.setItem(ENTRY_PLAYED_KEY, "1");
          } catch {
            playEntry = false;
          }
        }

        if (playEntry) {
          const es = clampScale(ns * ENTRY_START_FACTOR);
          setCam(
            clampCam({
              scale: es,
              tx: rect.width / 2 - CAR_PARK.x * es,
              ty: rect.height / 2 - CAR_PARK.y * es,
            }),
          );
          // 兩幀後起飛：確保起始鏡頭先完成 paint，transition 才有起點。
          requestAnimationFrame(() => {
            requestAnimationFrame(() => flyTo(CAR_PARK, ns));
          });
        } else {
          setCam(
            clampCam({
              scale: ns,
              tx: rect.width / 2 - CAR_PARK.x * ns,
              ty: rect.height / 2 - CAR_PARK.y * ns,
            }),
          );
        }
      } else {
        // resize（旋轉／視窗縮放）後依新尺寸重新 clamp，避免舞台卡在偏移位置。
        setCam((c) => clampCam(c));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewportEl);
    return () => ro.disconnect();
  }, [viewportEl, clampCam, flyTo, reduced]);

  // wheel 需非 passive 才能 preventDefault。
  useEffect(() => {
    if (!viewportEl) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = viewportEl.getBoundingClientRect();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomAt(factor, e.clientX - rect.left, e.clientY - rect.top);
    };
    viewportEl.addEventListener("wheel", onWheel, { passive: false });
    return () => viewportEl.removeEventListener("wheel", onWheel);
  }, [viewportEl, zoomAt]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // 島嶼 button 自行處理 click；勿 capture，否則 pointer 事件到不了 button。
      if ((e.target as Element).closest("button")) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size === 2) prevPinchRef.current = null;
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointers = pointersRef.current;
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const rect = e.currentTarget.getBoundingClientRect();
        const midX = (a.x + b.x) / 2 - rect.left;
        const midY = (a.y + b.y) / 2 - rect.top;
        const pp = prevPinchRef.current;
        if (pp && pp.dist > 0) {
          zoomAt(dist / pp.dist, midX, midY);
        }
        prevPinchRef.current = { dist };
      } else {
        panBy(cur.x - prev.x, cur.y - prev.y);
      }
    },
    [panBy, zoomAt],
  );

  const endPointer = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) prevPinchRef.current = null;
  }, []);

  return {
    scale: cam.scale,
    tx: cam.tx,
    ty: cam.ty,
    isAnimating: animating,
    bind: {
      ref: setViewportEl,
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
    },
    flyTo,
    reset,
    zoomBy,
  };
}
