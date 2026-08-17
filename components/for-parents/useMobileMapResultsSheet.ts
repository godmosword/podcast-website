"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";
import type { MobileMapResultsSnap } from "./PlayMapContract";

const MIN_PANEL_HEIGHT = 112;
const MAP_REVEAL_HEIGHT = 48;

export type MobileMapResultsSheetController = {
  snap: MobileMapResultsSnap;
  resizeEpoch: number;
  panelRef: RefObject<HTMLElement | null>;
  onHandleClick: () => void;
  onHandlePointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
};

export function mobileMapSnapHeights(containerHeight: number): Record<MobileMapResultsSnap, number> {
  const height = Number.isFinite(containerHeight) ? Math.max(0, containerHeight) : 0;
  const maxHeight = Math.max(MIN_PANEL_HEIGHT, height - MAP_REVEAL_HEIGHT);
  const clamp = (value: number, lower: number, upper: number) =>
    Math.min(upper, Math.max(lower, value));
  const collapsed = clamp(height * 0.18, MIN_PANEL_HEIGHT, maxHeight);
  const half = clamp(height * 0.5, collapsed, maxHeight);
  const expanded = clamp(height * 0.86, half, maxHeight);

  return { collapsed, half, expanded };
}

export function nearestMobileMapSnap(
  panelHeight: number,
  containerHeight: number,
): MobileMapResultsSnap {
  const heights = mobileMapSnapHeights(containerHeight);
  return (Object.keys(heights) as MobileMapResultsSnap[]).reduce(
    (nearest, candidate) =>
      Math.abs(heights[candidate] - panelHeight) <
      Math.abs(heights[nearest] - panelHeight)
        ? candidate
        : nearest,
    "collapsed",
  );
}

function nextSnap(snap: MobileMapResultsSnap): MobileMapResultsSnap {
  if (snap === "collapsed") return "half";
  if (snap === "half") return "expanded";
  return "collapsed";
}

type DragState = {
  pointerId: number | null;
  startY: number;
  startHeight: number;
  currentHeight: number;
  moved: boolean;
};

const IDLE_DRAG: DragState = {
  pointerId: null,
  startY: 0,
  startHeight: 0,
  currentHeight: 0,
  moved: false,
};

export function useMobileMapResultsSheet({
  active,
}: {
  active: boolean;
}): MobileMapResultsSheetController {
  const [snap, setSnap] = useState<MobileMapResultsSnap>("half");
  const [resizeEpoch, setResizeEpoch] = useState(0);
  const panelRef = useRef<HTMLElement>(null);
  const wasActiveRef = useRef(active);
  const dragRef = useRef<DragState>(IDLE_DRAG);
  const suppressClickRef = useRef(false);

  const snapTo = useCallback((next: MobileMapResultsSnap) => {
    setSnap((current) => {
      if (current === next) return current;
      setResizeEpoch((epoch) => epoch + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (active && !wasActiveRef.current) {
      setSnap("half");
    }
    wasActiveRef.current = active;
  }, [active]);

  const onHandleClick = useCallback(() => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    snapTo(nextSnap(snap));
  }, [snap, snapTo]);

  const onHandlePointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const panel = panelRef.current;
      if (!panel) return;

      const containerHeight = panel.parentElement?.getBoundingClientRect().height ?? 0;
      const snapHeights = mobileMapSnapHeights(containerHeight);
      const measuredHeight = panel.getBoundingClientRect().height;
      const startHeight = measuredHeight > 0 ? measuredHeight : snapHeights[snap];

      dragRef.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startHeight,
        currentHeight: startHeight,
        moved: false,
      };
      panel.dataset.dragging = "true";
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [snap],
  );

  const onHandlePointerMove = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      const panel = panelRef.current;
      if (!panel || drag.pointerId !== event.pointerId) return;

      const containerHeight = panel.parentElement?.getBoundingClientRect().height ?? 0;
      const maxHeight = Math.max(
        MIN_PANEL_HEIGHT,
        containerHeight - MAP_REVEAL_HEIGHT,
      );
      const nextHeight = Math.min(
        maxHeight,
        Math.max(
          MIN_PANEL_HEIGHT,
          drag.startHeight + drag.startY - event.clientY,
        ),
      );
      drag.currentHeight = nextHeight;
      drag.moved = drag.moved || Math.abs(nextHeight - drag.startHeight) > 4;
      panel.style.height = `${nextHeight}px`;
      event.preventDefault();
    },
    [],
  );

  const finishPointer = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      const drag = dragRef.current;
      const panel = panelRef.current;
      if (!panel || drag.pointerId !== event.pointerId) return;

      event.currentTarget.releasePointerCapture?.(event.pointerId);
      delete panel.dataset.dragging;
      panel.style.removeProperty("height");
      dragRef.current = IDLE_DRAG;

      if (drag.moved) {
        suppressClickRef.current = true;
        const containerHeight = panel.parentElement?.getBoundingClientRect().height ?? 0;
        snapTo(nearestMobileMapSnap(drag.currentHeight, containerHeight));
      }
    },
    [snapTo],
  );

  useEffect(() => {
    if (active) return;
    const panel = panelRef.current;
    if (panel) {
      delete panel.dataset.dragging;
      panel.style.removeProperty("height");
    }
    dragRef.current = IDLE_DRAG;
    suppressClickRef.current = false;
  }, [active]);

  return {
    snap,
    resizeEpoch,
    panelRef,
    onHandleClick,
    onHandlePointerDown,
    onHandlePointerMove,
    onHandlePointerUp: finishPointer,
    onHandlePointerCancel: finishPointer,
  };
}
