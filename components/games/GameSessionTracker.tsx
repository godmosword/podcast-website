"use client";

import { useEffect } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { trackGameSessionStart } from "@/lib/analytics";
import {
  ACTIVITY_FLUSH_SECONDS,
  addGameSeconds,
  clampVisibleSlice,
  createPlaybackClock,
  takePendingSeconds,
} from "@/lib/activity-log";

export default function GameSessionTracker({ gameId }: { gameId: GameKitGameId }) {
  useEffect(() => {
    trackGameSessionStart(gameId);
  }, [gameId]);

  useEffect(() => {
    const clock = createPlaybackClock();
    let lastMark = document.visibilityState === "visible" ? Date.now() : null;

    const flush = () => {
      const seconds = takePendingSeconds(clock);
      if (seconds > 0) addGameSeconds(gameId, seconds);
    };

    const sampleVisible = () => {
      const now = Date.now();
      if (document.visibilityState === "visible" && lastMark != null) {
        clock.pendingSeconds += clampVisibleSlice((now - lastMark) / 1000);
      }
      lastMark = document.visibilityState === "visible" ? now : null;
      if (clock.pendingSeconds >= ACTIVITY_FLUSH_SECONDS) flush();
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        const now = Date.now();
        if (lastMark != null) {
          clock.pendingSeconds += clampVisibleSlice((now - lastMark) / 1000);
        }
        lastMark = null;
        flush();
        return;
      }
      lastMark = Date.now();
    };

    const timer = window.setInterval(sampleVisible, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      const now = Date.now();
      if (lastMark != null) {
        clock.pendingSeconds += clampVisibleSlice((now - lastMark) / 1000);
        lastMark = null;
      }
      flush();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [gameId]);

  return null;
}
