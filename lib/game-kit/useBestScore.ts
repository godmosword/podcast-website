"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";

const LEGACY_KEYS: Record<GameKitGameId, string> = {
  "block-drop": "block-drop-best",
  "car-adventure": "car-adventure-best",
};

async function readLegacyBest(gameId: GameKitGameId): Promise<number> {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(LEGACY_KEYS[gameId]);
    if (raw == null) return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function writeLegacyBest(
  gameId: GameKitGameId,
  score: number,
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LEGACY_KEYS[gameId], String(score));
  } catch {
    /* localStorage 不可用 */
  }
}

export function useBestScore(gameId: GameKitGameId) {
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    void readLegacyBest(gameId).then((n) => {
      if (n > 0) setBest(n);
    });
  }, [gameId]);

  const saveBest = useCallback(
    async (score: number) => {
      setBest((prev) => {
        if (prev != null && score <= prev) return prev;
        void writeLegacyBest(gameId, score);
        return score;
      });
    },
    [gameId],
  );

  const getBest = useCallback(async () => {
    const n = await readLegacyBest(gameId);
    return n;
  }, [gameId]);

  return { best, saveBest, getBest } as const;
}
