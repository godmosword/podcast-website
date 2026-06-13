"use client";

import { useEffect, useState } from "react";
import { isGameAssetsReady, preloadGameAssets } from "@/lib/gamekit/preload";
import type { GameKitGameId } from "@/lib/gamekit/types";

export function useGameAssetPreload(gameId: GameKitGameId) {
  // SSR 一律 false，ready 只在 effect 內翻轉——
  // 避免「客戶端首次 render 已 ready、伺服器端 false」的 hydration mismatch
  const [ready, setReady] = useState(false);

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
