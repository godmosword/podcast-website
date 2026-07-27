"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ZoneCoord } from "@/data/universe-zones";
import {
  INERTIA_STOP_SPEED,
  MAX_SCALE,
  MIN_FLING_SPEED,
  MIN_SCALE,
  VELOCITY_IDLE_RESET_MS,
  blendVelocity,
  bucketMapScale,
  clampCamera,
  clampScale,
  decayVelocity,
  exceedsDragSlop,
  fitScaleFor,
  fitScaleForBox,
  flyDurationFor,
  islandContentCenter,
  isDoubleTap,
  poseFor,
  DOUBLE_TAP_ZOOM,
  type TapSample,
  wheelZoomFactor,
  zoomCameraAt,
} from "@/lib/universe/map-camera-utils";
import type { CameraPose } from "@/lib/universe/map-camera-visual";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * fly-to 過場時間（毫秒）的 fallback，與 CSS transition 對齊。
 * 預設時長已改由 `flyDurationFor` 依起訖鏡頭距離推導；此常數僅作為
 * 視覺層在尚未收到任何 flyTo 前的初值。
 */
export const FLY_DURATION_MS = 450;
/** 進場降落動畫：起始鏡頭相對 fit 的倍率（從高空俯瞰整個群島再飛向主島）。 */
const ENTRY_START_FACTOR = 0.55;
/**
 * 每個分頁 session 只播一次進場動畫，回訪不重播。
 * 寫入僅在量測 effect 內（播完進場或 `skipEntryAnimation` 時），禁止 render 期預寫。
 */
export const ENTRY_PLAYED_KEY = "cc-universe-entry-played";
const ZOOM_EPS = 0.0001;
/** 滾輪手勢結束判定：靜止超過此時長才 commit／解除 interacting。 */
const WHEEL_IDLE_MS = 140;

type Camera = CameraPose;

type FlyToOptions = {
  /** 視窗像素：正值把舞台往下推（島在畫面上移，留給底部 dock）。 */
  viewportOffsetY?: number;
  /** 飛行過場毫秒；預設由 `flyDurationFor` 依起訖鏡頭的感知距離推導。 */
  durationMs?: number;
  /**
   * 構圖框（stage px）：目標 scale 會被夾到「此框放得進視窗」的上限。
   * 手機直向進島時島比畫面寬，置中也看不到全島；桌面算出的上限高於
   * ISLAND_FOCUS_ZOOM，故不影響既有手感。
   */
  fitBox?: { w: number; h: number };
};

export type UseMapCameraOptions = {
  /**
   * 為 true 時跳過首訪進場降落動畫（島路徑深連結用），
   * 並在量測 effect 標記 ENTRY_PLAYED_KEY，避免離島後重播。
   */
  skipEntryAnimation?: boolean;
};

/** 預設鏡頭錨點：島群 bbox 中心（首屏／reset／回樂園皆對齊此點，島群置中不偏一側）。 */
const CONTENT_CENTER = islandContentCenter();

type MapCameraBind = {
  ref: (el: HTMLDivElement | null) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
};

export type CameraVisualMeta = {
  isAnimating: boolean;
  flyDurationMs: number;
};

export type CameraVisualApplier = (
  cam: Camera,
  meta: CameraVisualMeta,
) => void;

export type MapCamera = {
  scale: number;
  tx: number;
  ty: number;
  /**
   * 首次取得有效 viewport 尺寸後為 true。
   * 深連結 flyTo 應等此旗標，勿用姿態啟發式（fit 後可能恰為 1,0,0）。
   */
  isMeasured: boolean;
  isAnimating: boolean;
  /** 拖曳／pinch／滾輪／慣性進行中；供地圖降載動畫。 */
  isInteracting: boolean;
  /** 手勢／慣性結束後遞增；迷路自救等 idle 邏輯訂閱此值，勿訂閱每幀 cam。 */
  idleEpoch: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  bind: MapCameraBind;
  /** 註冊 DOM 視覺套用（stage／海面／視差）；連續鏡頭幀只走此路徑。 */
  bindVisual: (applier: CameraVisualApplier | null) => void;
  /** 讀取最新鏡頭（含尚未 commit 到 React 的視覺幀）。 */
  getCam: () => Camera;
  /** 讀取本次 fly-to 的 transition 時長（毫秒）。 */
  getFlyDurationMs: () => number;
  flyTo: (coord: ZoneCoord, targetScale?: number, options?: FlyToOptions) => void;
  reset: () => void;
  zoomBy: (delta: number) => void;
  panBy: (dx: number, dy: number) => void;
};

function zoomLimitsKey(scale: number): string {
  return `${scale < MAX_SCALE - ZOOM_EPS}:${scale > MIN_SCALE + ZOOM_EPS}`;
}

function shouldCommitReact(prev: Camera, next: Camera): boolean {
  if (bucketMapScale(prev.scale) !== bucketMapScale(next.scale)) return true;
  if (zoomLimitsKey(prev.scale) !== zoomLimitsKey(next.scale)) return true;
  return false;
}

export function useMapCamera(options: UseMapCameraOptions = {}): MapCamera {
  const reduced = useReducedMotion();
  const [cam, setCam] = useState<Camera>({ scale: 1, tx: 0, ty: 0 });
  const [animating, setAnimating] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [idleEpoch, setIdleEpoch] = useState(0);
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const [isMeasured, setIsMeasured] = useState(false);

  const camRef = useRef<Camera>(cam);
  const visualApplierRef = useRef<CameraVisualApplier | null>(null);
  const animatingRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0, left: 0, top: 0 });
  const initializedRef = useRef(false);
  const isMeasuredRef = useRef(false);
  const skipEntryAnimationRef = useRef(Boolean(options.skipEntryAnimation));
  skipEntryAnimationRef.current = Boolean(options.skipEntryAnimation);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const prevPinchRef = useRef<{ dist: number } | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** 本次 fly-to 的 CSS transition 時長（毫秒）。 */
  const flyDurationMsRef = useRef(FLY_DURATION_MS);
  const wheelIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactingRef = useRef(false);

  // 單指拖曳狀態：dragging 為 false 時仍在門檻內（等同點擊候選），越過 slop 才平移。
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    dragging: boolean;
  } | null>(null);

  // 雙擊/雙點放大：記錄上一次「點擊（未拖曳）」的時間與位置，用於偵測雙擊。
  const lastTapRef = useRef<TapSample | null>(null);

  // rAF 批次平移：把同一幀內多次 pointermove 的增量累積。
  const pendingPanRef = useRef({ dx: 0, dy: 0 });
  const panRafRef = useRef<number | null>(null);

  // rAF 批次縮放：同幀內倍率相乘、焦點取最新。
  const pendingZoomRef = useRef({ factor: 1, fx: 0, fy: 0 });
  const zoomRafRef = useRef<number | null>(null);

  // 速度取樣與慣性：velocityRef 為放手前的平滑速度（px/ms），供 startInertia 甩動。
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastSampleRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const inertiaRafRef = useRef<number | null>(null);

  const paintVisual = useCallback((next: Camera) => {
    visualApplierRef.current?.(next, {
      isAnimating: animatingRef.current,
      flyDurationMs: flyDurationMsRef.current,
    });
  }, []);

  const bindVisual = useCallback(
    (applier: CameraVisualApplier | null) => {
      visualApplierRef.current = applier;
      if (applier) {
        applier(camRef.current, {
          isAnimating: animatingRef.current,
          flyDurationMs: flyDurationMsRef.current,
        });
      }
    },
    [],
  );

  const getCam = useCallback(() => camRef.current, []);

  const getFlyDurationMs = useCallback(() => flyDurationMsRef.current, []);

  const setViewportInteractingAttr = useCallback(
    (on: boolean) => {
      if (!viewportEl) return;
      if (on) viewportEl.setAttribute("data-interacting", "");
      else viewportEl.removeAttribute("data-interacting");
    },
    [viewportEl],
  );

  const beginInteracting = useCallback(() => {
    if (!interactingRef.current) {
      interactingRef.current = true;
      setInteracting(true);
      setViewportInteractingAttr(true);
    }
  }, [setViewportInteractingAttr]);

  const endInteracting = useCallback(
    (commit: boolean) => {
      if (wheelIdleTimerRef.current) {
        clearTimeout(wheelIdleTimerRef.current);
        wheelIdleTimerRef.current = null;
      }
      if (interactingRef.current) {
        interactingRef.current = false;
        setInteracting(false);
        setViewportInteractingAttr(false);
      }
      if (commit) {
        const latest = camRef.current;
        setCam((prev) =>
          prev.scale === latest.scale &&
          prev.tx === latest.tx &&
          prev.ty === latest.ty
            ? prev
            : latest,
        );
      }
      setIdleEpoch((n) => n + 1);
    },
    [setViewportInteractingAttr],
  );

  const publishCam = useCallback(
    (next: Camera, mode: "visual" | "commit") => {
      camRef.current = next;
      paintVisual(next);
      if (mode === "commit") {
        setCam(next);
        return;
      }
      setCam((prev) => (shouldCommitReact(prev, next) ? next : prev));
    },
    [paintVisual],
  );

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
    (factor: number, focusX: number, focusY: number, mode: "visual" | "commit") => {
      stopInertia();
      const next = clampCam(zoomCameraAt(camRef.current, factor, focusX, focusY));
      publishCam(next, mode);
    },
    [clampCam, publishCam, stopInertia],
  );

  // 把本幀累積的縮放沖出（一幀一次視覺更新）。
  const flushZoom = useCallback(() => {
    zoomRafRef.current = null;
    const { factor, fx, fy } = pendingZoomRef.current;
    pendingZoomRef.current = { factor: 1, fx: 0, fy: 0 };
    if (Math.abs(factor - 1) < ZOOM_EPS) return;
    zoomAt(factor, fx, fy, "visual");
  }, [zoomAt]);

  // 累積縮放倍率，並在尚未排程時排一幀 rAF（pinch／wheel 用）。
  const scheduleZoom = useCallback(
    (factor: number, focusX: number, focusY: number) => {
      stopInertia();
      beginInteracting();
      pendingZoomRef.current.factor *= factor;
      pendingZoomRef.current.fx = focusX;
      pendingZoomRef.current.fy = focusY;
      if (zoomRafRef.current == null) {
        zoomRafRef.current = requestAnimationFrame(flushZoom);
      }
    },
    [beginInteracting, flushZoom, stopInertia],
  );

  const panByInternal = useCallback(
    (dx: number, dy: number, mode: "visual" | "commit") => {
      const c = camRef.current;
      const next = clampCam({ scale: c.scale, tx: c.tx + dx, ty: c.ty + dy });
      publishCam(next, mode);
    },
    [clampCam, publishCam],
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      panByInternal(dx, dy, "commit");
    },
    [panByInternal],
  );

  // 把本幀累積的平移增量沖出。
  const flushPan = useCallback(() => {
    panRafRef.current = null;
    const { dx, dy } = pendingPanRef.current;
    pendingPanRef.current = { dx: 0, dy: 0 };
    if (dx === 0 && dy === 0) return;
    panByInternal(dx, dy, "visual");
  }, [panByInternal]);

  // 累積平移增量，並在尚未排程時排一幀 rAF。
  const schedulePan = useCallback(
    (dx: number, dy: number) => {
      beginInteracting();
      pendingPanRef.current.dx += dx;
      pendingPanRef.current.dy += dy;
      if (panRafRef.current == null) {
        panRafRef.current = requestAnimationFrame(flushPan);
      }
    },
    [beginInteracting, flushPan],
  );

  // 放手後的慣性甩動：視覺幀；結束後 commit 並 bump idleEpoch。
  const startInertia = useCallback(() => {
    if (reduced) {
      endInteracting(true);
      return;
    }
    let vx = velocityRef.current.vx;
    let vy = velocityRef.current.vy;
    if (Math.hypot(vx, vy) < MIN_FLING_SPEED) {
      endInteracting(true);
      return;
    }
    beginInteracting();
    let lastT = performance.now();
    const step = (now: number) => {
      // 夾住長幀（分頁切回／掉幀）避免一次跳一大段。
      const dt = Math.min(now - lastT, 32);
      lastT = now;
      panByInternal(vx * dt, vy * dt, "visual");
      vx = decayVelocity(vx, dt);
      vy = decayVelocity(vy, dt);
      if (Math.hypot(vx, vy) < INERTIA_STOP_SPEED) {
        inertiaRafRef.current = null;
        endInteracting(true);
        return;
      }
      inertiaRafRef.current = requestAnimationFrame(step);
    };
    inertiaRafRef.current = requestAnimationFrame(step);
  }, [beginInteracting, endInteracting, panByInternal, reduced]);

  const flyTo = useCallback(
    (coord: ZoneCoord, targetScale?: number, options?: FlyToOptions) => {
      stopInertia();
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) return;
      const wanted = clampScale(targetScale ?? camRef.current.scale);
      const ns = options?.fitBox
        ? Math.min(wanted, fitScaleForBox(options.fitBox, w, h))
        : wanted;
      const offsetY = options?.viewportOffsetY ?? 0;
      const next = clampCam(poseFor(coord, ns, w, h, offsetY));
      // 先開啟 transition，再寫 transform，CSS 才會插值。
      if (!reduced) {
        // 時長是距離的函式：近距離縮放自動變快、跨島飛行自動變慢。
        const durationMs =
          options?.durationMs ?? flyDurationFor(camRef.current, next, w, h);
        flyDurationMsRef.current = durationMs;
        animatingRef.current = true;
        setAnimating(true);
        if (animTimerRef.current) clearTimeout(animTimerRef.current);
        animTimerRef.current = setTimeout(() => {
          animatingRef.current = false;
          setAnimating(false);
          paintVisual(camRef.current);
          setIdleEpoch((n) => n + 1);
        }, durationMs);
      }
      publishCam(next, "commit");
    },
    [clampCam, paintVisual, publishCam, reduced, stopInertia],
  );

  const fitScale = useCallback((): number => {
    const { w, h } = sizeRef.current;
    return fitScaleFor(w, h);
  }, []);

  const reset = useCallback(() => {
    flyTo(CONTENT_CENTER, fitScale());
  }, [flyTo, fitScale]);

  const zoomBy = useCallback(
    (delta: number) => {
      const { w, h } = sizeRef.current;
      zoomAt(1 + delta, w / 2, h / 2, "commit");
      setIdleEpoch((n) => n + 1);
    },
    [zoomAt],
  );

  const refreshViewportRect = useCallback((el: HTMLDivElement) => {
    const rect = el.getBoundingClientRect();
    sizeRef.current = {
      w: rect.width,
      h: rect.height,
      left: rect.left,
      top: rect.top,
    };
    if (
      !isMeasuredRef.current &&
      rect.width > 0 &&
      rect.height > 0
    ) {
      isMeasuredRef.current = true;
      setIsMeasured(true);
    }
    return rect;
  }, []);

  // 量測 viewport 尺寸 + 首次置中島群（CONTENT_CENTER）。
  useEffect(() => {
    if (!viewportEl) return;
    const measure = () => {
      const rect = refreshViewportRect(viewportEl);
      if (rect.width === 0 || rect.height === 0) return;
      if (!initializedRef.current) {
        initializedRef.current = true;
        const ns = fitScaleFor(rect.width, rect.height);

        // 進場降落：首次進園從高空俯瞰整個群島，再飛向主島（每 session 一次）。
        // 島路徑以 skipEntryAnimation 跳過，不依賴 render 期預寫 sessionStorage。
        const skipEntry = skipEntryAnimationRef.current;
        let playEntry = false;
        if (!reduced && !skipEntry) {
          try {
            playEntry = !sessionStorage.getItem(ENTRY_PLAYED_KEY);
            if (playEntry) sessionStorage.setItem(ENTRY_PLAYED_KEY, "1");
          } catch {
            playEntry = false;
          }
        } else if (skipEntry) {
          try {
            sessionStorage.setItem(ENTRY_PLAYED_KEY, "1");
          } catch {
            // sessionStorage 不可用時仍跳過進場
          }
        }

        if (playEntry) {
          const es = clampScale(ns * ENTRY_START_FACTOR);
          publishCam(
            clampCam(poseFor(CONTENT_CENTER, es, rect.width, rect.height)),
            "commit",
          );
          requestAnimationFrame(() => {
            requestAnimationFrame(() => flyTo(CONTENT_CENTER, ns));
          });
        } else {
          publishCam(
            clampCam(poseFor(CONTENT_CENTER, ns, rect.width, rect.height)),
            "commit",
          );
        }
      } else {
        publishCam(clampCam(camRef.current), "commit");
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewportEl);
    return () => ro.disconnect();
  }, [viewportEl, clampCam, flyTo, publishCam, reduced, refreshViewportRect]);

  // wheel 需非 passive 才能 preventDefault；焦點座標優先用快取的 viewport rect。
  useEffect(() => {
    if (!viewportEl) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { w, h } = sizeRef.current;
      // 尺寸尚未量到時補一次；滾動後 left/top 可能過期，手勢開始時刷新。
      if (w === 0 || h === 0 || !interactingRef.current) {
        refreshViewportRect(viewportEl);
      }
      const origin = sizeRef.current;
      scheduleZoom(
        wheelZoomFactor(e.deltaY),
        e.clientX - origin.left,
        e.clientY - origin.top,
      );
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = setTimeout(() => {
        wheelIdleTimerRef.current = null;
        if (zoomRafRef.current != null) {
          cancelAnimationFrame(zoomRafRef.current);
          zoomRafRef.current = null;
          flushZoom();
        }
        endInteracting(true);
      }, WHEEL_IDLE_MS);
    };
    viewportEl.addEventListener("wheel", onWheel, { passive: false });
    return () => viewportEl.removeEventListener("wheel", onWheel);
  }, [
    viewportEl,
    scheduleZoom,
    refreshViewportRect,
    flushZoom,
    endInteracting,
  ]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (wheelIdleTimerRef.current) clearTimeout(wheelIdleTimerRef.current);
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
      refreshViewportRect(e.currentTarget);

      const panEligible = e.pointerType !== "mouse" || e.button === 0;
      if (!panEligible) return;

      e.currentTarget.setPointerCapture?.(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointersRef.current.size >= 2) {
        // 進入雙指 pinch：放棄單指拖曳候選，重置 pinch 基準。
        dragRef.current = null;
        prevPinchRef.current = null;
        beginInteracting();
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
    [beginInteracting, refreshViewportRect, stopInertia],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointers = pointersRef.current;
      if (!pointers.has(e.pointerId)) return;
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      // 雙指 pinch 縮放：距離比值經 rAF 批次；焦點用快取 origin。
      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const { left, top } = sizeRef.current;
        const midX = (a.x + b.x) / 2 - left;
        const midY = (a.y + b.y) / 2 - top;
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
        beginInteracting();
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
    [beginInteracting, schedulePan, scheduleZoom],
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
      if (!drag || drag.pointerId !== e.pointerId) {
        // pinch 結束（無對應 drag）：若已無指標則結束 interacting。
        if (pointersRef.current.size === 0 && interactingRef.current) {
          endInteracting(true);
        }
        return;
      }
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
        if (idle <= VELOCITY_IDLE_RESET_MS) {
          startInertia();
          velocityRef.current = { vx: 0, vy: 0 };
          lastSampleRef.current = null;
          return;
        }
      }
      velocityRef.current = { vx: 0, vy: 0 };
      lastSampleRef.current = null;

      // 空白地圖上的「點擊（未拖曳）」：偵測雙擊 → 放大並置中該點（複用 flyTo 動畫）。
      // 島本體點擊走 button（onPointerDown 已提早 return），不會進到這裡。
      if (!wasDragging) {
        const { left, top } = sizeRef.current;
        const tap: TapSample = { t: performance.now(), x: e.clientX, y: e.clientY };
        if (isDoubleTap(lastTapRef.current, tap)) {
          lastTapRef.current = null;
          const cam = camRef.current;
          const ns = clampScale(cam.scale * DOUBLE_TAP_ZOOM);
          if (ns > cam.scale + ZOOM_EPS) {
            const stageX = (e.clientX - left - cam.tx) / cam.scale;
            const stageY = (e.clientY - top - cam.ty) / cam.scale;
            // 時長由 flyTo 依距離推導（雙擊位移小 → 自然比進島快）。
            flyTo({ x: stageX, y: stageY }, ns);
          }
        } else {
          lastTapRef.current = tap;
        }
      }

      if (wasDragging || interactingRef.current) {
        endInteracting(true);
      }
    },
    [endInteracting, flushPan, flushZoom, startInertia, flyTo],
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
    isMeasured,
    isAnimating: animating,
    isInteracting: interacting,
    idleEpoch,
    canZoomIn: cam.scale < MAX_SCALE - ZOOM_EPS,
    canZoomOut: cam.scale > MIN_SCALE + ZOOM_EPS,
    bind: {
      ref: setViewportEl,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
    },
    bindVisual,
    getCam,
    getFlyDurationMs,
    flyTo,
    reset,
    zoomBy,
    panBy,
  };
}
