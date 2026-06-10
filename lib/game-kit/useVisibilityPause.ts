"use client";

import { useEffect } from "react";

type VisibilityPauseOptions = {
  enabled?: boolean;
  onHidden: () => void;
  onVisible: () => void;
};

/** 頁面不可見時觸發暫停回呼（與 useGameLoop 的 pauseOnHidden 互補，用於狀態機層）。 */
export function useVisibilityPause({
  enabled = true,
  onHidden,
  onVisible,
}: VisibilityPauseOptions) {
  useEffect(() => {
    if (!enabled) return;

    const onVis = () => {
      if (document.hidden) onHidden();
      else onVisible();
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [enabled, onHidden, onVisible]);
}
