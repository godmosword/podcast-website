"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import {
  PROGRESS_CHANGE_EVENT,
  getBestScoreFromStore,
  saveBestScoreInStore,
} from "@/lib/progress-store";

export function useBestScore(gameId: GameKitGameId) {
  const [best, setBest] = useState<number | null>(null);

  const refresh = useCallback(() => {
    const n = getBestScoreFromStore(gameId);
    setBest(n > 0 ? n : null);
  }, [gameId]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(PROGRESS_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(PROGRESS_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const saveBest = useCallback(
    async (score: number) => {
      const next = saveBestScoreInStore(gameId, score);
      setBest(next);
    },
    [gameId],
  );

  const getBest = useCallback(async () => getBestScoreFromStore(gameId), [gameId]);

  return { best, saveBest, getBest } as const;
}
