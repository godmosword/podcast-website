"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_PROGRESS,
  getProgressSync,
  subscribeProgress,
  type ProgressStore,
} from "@/lib/progress-store";

function getServerSnapshot(): ProgressStore {
  return DEFAULT_PROGRESS;
}

/** Client hook：訂閱統一進度 store，SSR 安全。 */
export function useProgress(): ProgressStore {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const unsubLocal = subscribeProgress(onStoreChange);
      const onEvent = () => onStoreChange();
      window.addEventListener("cheche:progress-change", onEvent);
      window.addEventListener("storage", onEvent);
      return () => {
        unsubLocal();
        window.removeEventListener("cheche:progress-change", onEvent);
        window.removeEventListener("storage", onEvent);
      };
    },
    [],
  );

  return useSyncExternalStore(
    subscribe,
    getProgressSync,
    getServerSnapshot,
  );
}
