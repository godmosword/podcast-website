"use client";
import { useCallback, useRef, useState, type RefObject } from "react";
export type ColoringPoint = { x: number; y: number };
export type ColoringView = { scale: number; tx: number; ty: number };
export const DEFAULT_COLORING_VIEW: ColoringView = { scale: 1, tx: 0, ty: 0 };
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
export function useColoringGesture(
  stage: RefObject<HTMLDivElement | null>,
  canvas: RefObject<HTMLCanvasElement | null>,
) {
  const pointersRef = useRef(new Map<number, ColoringPoint>()),
    viewRef = useRef(DEFAULT_COLORING_VIEW);
  const gestureRef = useRef<{
    startDist: number;
    startMid: ColoringPoint;
    startView: ColoringView;
  } | null>(null);
  const [viewActive, setViewActive] = useState(false);
  const applyView = useCallback(
    (next: ColoringView) => {
      const s = stage.current,
        c = canvas.current;
      if (!s || !c) return;
      const rect = s.getBoundingClientRect(),
        scale = clamp(next.scale, 1, 4);
      const view = {
        scale,
        tx: clamp(next.tx, rect.width * (1 - scale), 0),
        ty: clamp(next.ty, rect.height * (1 - scale), 0),
      };
      viewRef.current = view;
      c.style.transform = `translate(${view.tx}px,${view.ty}px) scale(${view.scale})`;
      setViewActive(view.scale !== 1 || view.tx !== 0 || view.ty !== 0);
    },
    [stage, canvas],
  );
  const startGesture = useCallback(() => {
    const pts = [...pointersRef.current.values()],
      s = stage.current;
    if (pts.length !== 2 || !s) return;
    const rect = s.getBoundingClientRect();
    gestureRef.current = {
      startDist: Math.max(
        1,
        Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y),
      ),
      startMid: {
        x: (pts[0]!.x + pts[1]!.x) / 2 - rect.left,
        y: (pts[0]!.y + pts[1]!.y) / 2 - rect.top,
      },
      startView: viewRef.current,
    };
  }, [stage]);
  const applyGesture = useCallback(() => {
    const g = gestureRef.current,
      s = stage.current,
      pts = [...pointersRef.current.values()];
    if (!g || !s || pts.length !== 2) return;
    const rect = s.getBoundingClientRect(),
      dist = Math.max(
        1,
        Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y),
      );
    const mid = {
        x: (pts[0]!.x + pts[1]!.x) / 2 - rect.left,
        y: (pts[0]!.y + pts[1]!.y) / 2 - rect.top,
      },
      scale = clamp((g.startView.scale * dist) / g.startDist, 1, 4);
    applyView({
      scale,
      tx: mid.x - ((g.startMid.x - g.startView.tx) * scale) / g.startView.scale,
      ty: mid.y - ((g.startMid.y - g.startView.ty) * scale) / g.startView.scale,
    });
  }, [stage, applyView]);
  return {
    pointersRef,
    viewRef,
    gestureRef,
    viewActive,
    applyView,
    startGesture,
    applyGesture,
  };
}
