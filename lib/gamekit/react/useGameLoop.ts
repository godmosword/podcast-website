"use client";

import { useCallback, useEffect, useRef } from "react";

export type GameLoopOptions = {
  enabled?: boolean;
  onFrame: (dt: number, now: number) => void;
  maxDeltaMs?: number;
  pauseOnHidden?: boolean;
};

export type GameLoopControls = {
  pause: () => void;
  resume: () => void;
  isPaused: () => boolean;
  isVisible: () => boolean;
};

/**
 * requestAnimationFrame 迴圈：提供 delta time、手動 pause/resume、
 * 頁面不可見時自動暫停。
 */
export function useGameLoop(
  options: GameLoopOptions,
): GameLoopControls {
  const {
    enabled = true,
    onFrame,
    maxDeltaMs = 100,
    pauseOnHidden = true,
  } = options;

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const pausedRef = useRef(false);
  const visibleRef = useRef(true);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef(0);

  const pause = useCallback(() => {
    pausedRef.current = true;
    lastTimeRef.current = null;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
    lastTimeRef.current = null;
  }, []);

  useEffect(() => {
    if (!enabled) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = (now: number) => {
      rafRef.current = requestAnimationFrame(tick);

      if (pausedRef.current || (pauseOnHidden && !visibleRef.current)) {
        lastTimeRef.current = null;
        return;
      }

      if (lastTimeRef.current == null) {
        lastTimeRef.current = now;
        return;
      }

      let dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      if (dt > maxDeltaMs) dt = maxDeltaMs;

      onFrameRef.current(dt, now);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [enabled, maxDeltaMs, pauseOnHidden]);

  useEffect(() => {
    if (!pauseOnHidden) return;

    const onVis = () => {
      visibleRef.current = !document.hidden;
      if (document.hidden) {
        lastTimeRef.current = null;
      }
    };

    visibleRef.current = !document.hidden;
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pauseOnHidden]);

  return {
    pause,
    resume,
    isPaused: () => pausedRef.current,
    isVisible: () => visibleRef.current,
  };
}
