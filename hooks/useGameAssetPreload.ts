"use client";

import { useEffect } from "react";
import {
  isGameAssetsReady,
  preloadGameAssets,
} from "@/lib/gamekit/runtime/preload";
import type { GameKitGameId } from "@/lib/gamekit/types";
import type { GameLoadPhase } from "@/lib/gamekit/react/game-load";
import { useGameLoadGate } from "@/lib/gamekit/react/useGameLoadGate";

type UseGameAssetPreloadOptions = {
  /** true：等使用者點「開始」才預載程序生成 sheet（canvas 遊戲可選） */
  manualStart?: boolean;
};

/**
 * 預載 GameKit 程序生成 sheet，並在相同遊戲生命週期內重用快取。
 */
export function useGameAssetPreload(
  gameId: GameKitGameId,
  options: UseGameAssetPreloadOptions = {},
) {
  const manualStart = options.manualStart ?? false;
  const gate = useGameLoadGate({ manualStart, loadTimeoutMs: 15_000 });

  const { phase: gatePhase, attempt: gateAttempt, markReady } = gate;

  useEffect(() => {
    if (gatePhase !== "loading") return;
    let cancelled = false;
    if (isGameAssetsReady(gameId)) {
      markReady();
      return;
    }
    preloadGameAssets(gameId).then(() => {
      if (!cancelled) markReady();
    });
    return () => {
      cancelled = true;
    };
  }, [gameId, gatePhase, gateAttempt, markReady]);

  const ready = gate.phase === "ready";

  return {
    ready,
    phase: gate.phase as GameLoadPhase,
    start: gate.start,
    retry: gate.retry,
  };
}
