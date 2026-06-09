"use client";

import { useCallback, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type SwipeDir = "left" | "right" | "up" | "down";

export type SwipeHandlers = Partial<Record<SwipeDir, () => void>>;

/**
 * 在遊戲畫面上滑動換道／方向（手機友善）。
 * 綁到 `onPointerDown` / `onPointerUp` / `onPointerCancel`。
 */
export function useSwipeGesture(
  handlers: SwipeHandlers,
  minDistance = 32,
) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    start.current = { x: e.clientX, y: e.clientY };
  }, []);

  const clear = useCallback(() => {
    start.current = null;
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      start.current = null;
      if (Math.hypot(dx, dy) < minDistance) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        handlers[dx > 0 ? "right" : "left"]?.();
      } else {
        handlers[dy > 0 ? "down" : "up"]?.();
      }
    },
    [handlers, minDistance],
  );

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: clear,
  };
}
