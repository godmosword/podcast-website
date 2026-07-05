"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAP_STAGE, ZONES, type ZoneCoord } from "@/data/universe-zones";
import {
  CLICK_ZOOM_IN_FACTOR,
  CLICK_ZOOM_OUT_FACTOR,
  clampScale,
  fitScaleFor,
  pointerTravelExceeded,
  wheelZoomFactor,
} from "@/lib/universe/map-camera-utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** 允許少量 overscroll，讓拖曳手感不死板。 */
const OVERSCROLL = 48;
/** fly-to 過場時間（毫秒），與 CSS transition 對齊。 */
export const FLY_DURATION_MS = 600;
/** 進場降落動畫：起始鏡頭相對 fit 的倍率（從高空俯瞰整個群島再飛向主島）。 */
const ENTRY_START_FACTOR = 0.55;
/** 每個分頁 session 只播一次進場動畫，回訪不重播。 */
const ENTRY_PLAYED_KEY = "cc-universe-entry-played";

type Camera = { scale: number; tx: number; ty: number };

type PointerSession = {
  startX: number;
  startY: number;
  button: number;
  pointerType: string;
  dragged: boolean;
};

type FlyToOptions = {
  /** 視窗像素：正值把舞台往下推（島在畫面上移，留給底部 dock）。 */
  viewportOffsetY?: number;
};

const CAR_PARK =
  ZONES.find((z) => z.id === "car-park")?.coord ?? { x: 500, y: 400 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

type MapCameraBind = {
  ref: (el: HTMLDivElement | null) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
};

export type MapCamera = {
  scale: number;
  tx: number;
  ty: number;
  isAnimating: boolean;
  bind: MapCameraBind;
  flyTo: (coord: ZoneCoord, targetScale?: number, options?: FlyToOptions) => void;
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
  const sessionsRef = useRef(new Map<number, PointerSession>());
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
    (coord: ZoneCoord, targetScale?: number, options?: FlyToOptions) => {
      setCam((c) => {
        const { w, h } = sizeRef.current;
        if (w === 0 || h === 0) return c;
        const ns = clampScale(targetScale ?? c.scale);
        const offsetY = options?.viewportOffsetY ?? 0;
        const tx = w / 2 - coord.x * ns;
        const ty = h / 2 - coord.y * ns + offsetY;
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
    return fitScaleFor(w, h);
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
        const ns = fitScaleFor(rect.width, rect.height);

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
      zoomAt(
        wheelZoomFactor(e.deltaY),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
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
      if ((e.target as Element).closest("button")) return;

      if (e.pointerType === "mouse" && e.button === 2) {
        e.preventDefault();
      }

      sessionsRef.current.set(e.pointerId, {
        startX: e.clientX,
        startY: e.clientY,
        button: e.button,
        pointerType: e.pointerType,
        dragged: false,
      });

      const panEligible =
        e.pointerType !== "mouse" || e.button === 0;
      if (panEligible) {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointersRef.current.size === 2) prevPinchRef.current = null;
      }
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const session = sessionsRef.current.get(e.pointerId);
      if (session && !session.dragged) {
        const dx = e.clientX - session.startX;
        const dy = e.clientY - session.startY;
        if (pointerTravelExceeded(dx, dy)) {
          session.dragged = true;
        }
      }

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

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const session = sessionsRef.current.get(e.pointerId);
      sessionsRef.current.delete(e.pointerId);
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) prevPinchRef.current = null;

      if (
        session &&
        !session.dragged &&
        session.pointerType === "mouse" &&
        pointersRef.current.size === 0
      ) {
        const rect = e.currentTarget.getBoundingClientRect();
        const fx = e.clientX - rect.left;
        const fy = e.clientY - rect.top;
        if (session.button === 0) {
          zoomAt(CLICK_ZOOM_IN_FACTOR, fx, fy);
        } else if (session.button === 2) {
          zoomAt(CLICK_ZOOM_OUT_FACTOR, fx, fy);
        }
      }
    },
    [zoomAt],
  );

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
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
      onContextMenu,
    },
    flyTo,
    reset,
    zoomBy,
  };
}
