"use client";

import { useEffect, useState } from "react";
import { isGameAssetsReady, preloadGameAssets } from "@/lib/gamekit/preload";
import type { GameKitGameId } from "@/lib/gamekit/types";

export function useGameAssetPreload(gameId: GameKitGameId) {
  const [ready, setReady] = useState(() =>
    typeof window === "undefined" ? false : isGameAssetsReady(gameId),
  );

  useEffect(() => {
    let cancelled = false;
    if (isGameAssetsReady(gameId)) {
      setReady(true);
      return;
    }
    preloadGameAssets(gameId).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [gameId]);

  return { ready };
}
