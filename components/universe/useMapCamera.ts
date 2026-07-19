"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZONES, type ZoneCoord } from "@/data/universe-zones";
import {
  INERTIA_STOP_SPEED,
  MAX_SCALE,
  MIN_FLING_SPEED,
  MIN_SCALE,
  VELOCITY_IDLE_RESET_MS,
  blendVelocity,
  clampCamera,
  clampScale,
  decayVelocity,
  exceedsDragSlop,
  fitScaleFor,
  wheelZoomFactor,
  zoomCameraAt,
} from "@/lib/universe/map-camera-utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/** fly-to 過場時間（毫秒），與 CSS transition 對齊。 */
export const FLY_DURATION_MS = 600;
/** 進場降落動畫：起始鏡頭相對 fit 的倍率（從高空俯瞰整個群島再飛向主島）。 */
const ENTRY_START_FACTOR = 0.55;
/** 每個分頁 session 只播一次進場動畫，回訪不重播；深連結入場會預寫此 key 跳過進場（見 UniverseMap）。 */
export const ENTRY_PLAYED_KEY = "cc-universe-entry-played";
const ZOOM_EPS = 0.0001;

type Camera = { scale: number; tx: number; ty: number };

type FlyToOptions = {
  /** 視窗像素：正值把舞台往下推（島在畫面上移，留給底部 dock）。 */
  viewportOffsetY?: number;
};

const CAR_PARK =
  ZONES.find((z) => z.id === "car-park")?.coord ?? { x: 500, y: 400 };

type MapCameraBind = {
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
  canZoomIn: boolean;
  canZoomOut: boolean;
  bind: MapCameraBind;
  flyTo: (coord: ZoneCoord, targetScale?: number, options?: FlyToOptions) => void;
  reset: () => void;
  zoomBy: (delta: number) => void;
  panBy: (dx: number, dy: number) => void;
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

  // 單指拖曳狀態：dragging 為 false 時仍在門檻內（等同點擊候選），越過 slop 才平移。
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    dragging: boolean;
  } | null>(null);

  // rAF 批次平移：把同一幀內多次 pointermove 的增量累積，一幀只 setCam 一次。
  const pendingPanRef = useRef({ dx: 0, dy: 0 });
  const panRafRef = useRef<number | null>(null);

  // rAF 批次縮放：同幀內倍率相乘、焦點取最新，一幀只 setCam 一次（對齊 pan）。
  const pendingZoomRef = useRef({ factor: 1, fx: 0, fy: 0 });
  const zoomRafRef = useRef<number | null>(null);

  // 速度取樣與慣性：velocityRef 為放手前的平滑速度（px/ms），供 startInertia 甩動。
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastSampleRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const inertiaRafRef = useRef<number | null>(null);

  // 取消進行中的慣性動畫（放手甩動、或任何主動改鏡頭時呼叫）。
  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current != null) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  const clampCam = useCallback((next: Camera): Camera => {
    const { w, h } = sizeRef.current;
    return clampCamera(next, w, h);
  }, []);

  /** 立即套用縮放（按鈕／flush）；會中止慣性。 */
  const zoomAt = useCallback(
    (factor: number, focusX: number, focusY: number) => {
      stopInertia();
      setCam((c) => clampCam(zoomCameraAt(c, factor, focusX, focusY)));
    },
    [clampCam, stopInertia],
  );

  // 把本幀累積的縮放沖出（一幀一次 setCam）。
  const flushZoom = useCallback(() => {
    zoomRafRef.current = null;
    const { factor, fx, fy } = pendingZoomRef.current;
    pendingZoomRef.current = { factor: 1, fx: 0, fy: 0 };
    if (Math.abs(factor - 1) < ZOOM_EPS) return;
    zoomAt(factor, fx, fy);
  }, [zoomAt]);

  // 累積縮放倍率，並在尚未排程時排一幀 rAF（pinch／wheel 用）。
  const scheduleZoom = useCallback(
    (factor: number, focusX: number, focusY: number) => {
      stopInertia();
      pendingZoomRef.current.factor *= factor;
      pendingZoomRef.current.fx = focusX;
      pendingZoomRef.current.fy = focusY;
      if (zoomRafRef.current == null) {
        zoomRafRef.current = requestAnimationFrame(flushZoom);
      }
    },
    [flushZoom, stopInertia],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setCam((c) => clampCam({ scale: c.scale, tx: c.tx + dx, ty: c.ty + dy }));
    },
    [clampCam],
  );

  // 把本幀累積的平移增量沖出（一幀一次 setCam），並清空待處理值。
  const flushPan = useCallback(() => {
    panRafRef.current = null;
    const { dx, dy } = pendingPanRef.current;
    pendingPanRef.current = { dx: 0, dy: 0 };
    if (dx === 0 && dy === 0) return;
    panBy(dx, dy);
  }, [panBy]);

  // 累積平移增量，並在尚未排程時排一幀 rAF（rAF 批次，避免每次 pointermove 都 setState）。
  const schedulePan = useCallback(
    (dx: number, dy: number) => {
      pendingPanRef.current.dx += dx;
      pendingPanRef.current.dy += dy;
      if (panRafRef.current == null) {
        panRafRef.current = requestAnimationFrame(flushPan);
      }
    },
    [flushPan],
  );

  // 放手後的慣性甩動：以放手前速度為初速，逐幀依經過時間指數衰減，低於停止速度即結束。
  const startInertia = useCallback(() => {
    if (reduced) return;
    let vx = velocityRef.current.vx;
    let vy = velocityRef.current.vy;
    if (Math.hypot(vx, vy) < MIN_FLING_SPEED) return;
    let lastT = performance.now();
    const step = (now: number) => {
      // 夾住長幀（分頁切回／掉幀）避免一次跳一大段。
      const dt = Math.min(now - lastT, 32);
      lastT = now;
      panBy(vx * dt, vy * dt);
      vx = decayVelocity(vx, dt);
      vy = decayVelocity(vy, dt);
      if (Math.hypot(vx, vy) < INERTIA_STOP_SPEED) {
        inertiaRafRef.current = null;
        return;
      }
      inertiaRafRef.current = requestAnimationFrame(step);
    };
    inertiaRafRef.current = requestAnimationFrame(step);
  }, [panBy, reduced]);

  const flyTo = useCallback(
    (coord: ZoneCoord, targetScale?: number, options?: FlyToOptions) => {
      stopInertia();
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
    [clampCam, reduced, stopInertia],
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

  // wheel 需非 passive 才能 preventDefault；縮走 rAF 批次避免每 delta 都 setState。
  useEffect(() => {
    if (!viewportEl) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = viewportEl.getBoundingClientRect();
      scheduleZoom(
        wheelZoomFactor(e.deltaY),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    viewportEl.addEventListener("wheel", onWheel, { passive: false });
    return () => viewportEl.removeEventListener("wheel", onWheel);
  }, [viewportEl, scheduleZoom]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (panRafRef.current != null) cancelAnimationFrame(panRafRef.current);
      if (zoomRafRef.current != null) cancelAnimationFrame(zoomRafRef.current);
      if (inertiaRafRef.current != null)
        cancelAnimationFrame(inertiaRafRef.current);
    };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as Element).closest("button")) return;

      // 任何新的指標接觸都先中止慣性甩動（可立即抓住畫面）。
      stopInertia();

      const panEligible = e.pointerType !== "mouse" || e.button === 0;
      if (!panEligible) return;

      e.currentTarget.setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size >= 2) {
        // 進入雙指 pinch：放棄單指拖曳候選，重置 pinch 基準。
        dragRef.current = null;
        prevPinchRef.current = null;
        return;
      }

      // 單指：先進「點擊候選」狀態，越過 slop 才真正平移。
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        dragging: false,
      };
      velocityRef.current = { vx: 0, vy: 0 };
      lastSampleRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    },
    [stopInertia],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointers = pointersRef.current;
      if (!pointers.has(e.pointerId)) return;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      // 雙指 pinch 縮放：距離比值經 rAF 批次（與 pan 同節奏，一幀一次 setCam）。
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
          scheduleZoom(dist / pp.dist, midX, midY);
        }
        prevPinchRef.current = { dist };
        return;
      }

      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;

      // 尚未越過 slop：只累積判定、不平移，避免點島／點海的微幅抖動被當拖曳。
      if (!drag.dragging) {
        if (!exceedsDragSlop(cur.x - drag.startX, cur.y - drag.startY)) return;
        drag.dragging = true;
        // 越過門檻的當下把基準點與速度取樣重置到目前位置，
        // 避免把門檻內的位移一次補回造成畫面跳一下。
        drag.lastX = cur.x;
        drag.lastY = cur.y;
        lastSampleRef.current = { x: cur.x, y: cur.y, t: performance.now() };
        return;
      }

      const dx = cur.x - drag.lastX;
      const dy = cur.y - drag.lastY;
      drag.lastX = cur.x;
      drag.lastY = cur.y;
      schedulePan(dx, dy);

      // 更新平滑速度（px/ms），供放手後的慣性使用。
      const now = performance.now();
      const sample = lastSampleRef.current;
      if (sample) {
        const dt = now - sample.t;
        if (dt > 0) {
          velocityRef.current = {
            vx: blendVelocity(velocityRef.current.vx, (cur.x - sample.x) / dt),
            vy: blendVelocity(velocityRef.current.vy, (cur.y - sample.y) / dt),
          };
        }
      }
      lastSampleRef.current = { x: cur.x, y: cur.y, t: now };
    },
    [schedulePan, scheduleZoom],
  );

  const endPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, allowInertia: boolean) => {
      pointersRef.current.delete(e.pointerId);
      // 離開雙指：沖出待處理縮放，避免最後一格 pinch 掉幀。
      if (pointersRef.current.size < 2) {
        prevPinchRef.current = null;
        if (zoomRafRef.current != null) {
          cancelAnimationFrame(zoomRafRef.current);
          zoomRafRef.current = null;
          flushZoom();
        }
      }

      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const wasDragging = drag.dragging;
      dragRef.current = null;

      // 先把本幀待處理的平移同步沖出，確保放手時位置與慣性初值銜接、不掉一格。
      if (panRafRef.current != null) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
        flushPan();
      }

      // 只有真的拖曳過、且放手前仍在移動（非停住）才啟動慣性。
      if (allowInertia && wasDragging) {
        const idle = performance.now() - (lastSampleRef.current?.t ?? 0);
        if (idle <= VELOCITY_IDLE_RESET_MS) startInertia();
      }
      velocityRef.current = { vx: 0, vy: 0 };
      lastSampleRef.current = null;
    },
    [flushPan, flushZoom, startInertia],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => endPointer(e, true),
    [endPointer],
  );

  // pointercancel（瀏覽器接管手勢等）：結束拖曳但不甩動，避免非預期慣性。
  const onPointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => endPointer(e, false),
    [endPointer],
  );

  return {
    scale: cam.scale,
    tx: cam.tx,
    ty: cam.ty,
    isAnimating: animating,
    canZoomIn: cam.scale < MAX_SCALE - ZOOM_EPS,
    canZoomOut: cam.scale > MIN_SCALE + ZOOM_EPS,
    bind: {
      ref: setViewportEl,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    flyTo,
    reset,
    zoomBy,
    panBy,
  };
}
