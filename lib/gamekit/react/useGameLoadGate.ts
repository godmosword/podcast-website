"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_GAME_LOAD_TIMEOUT_MS,
  type GameLoadPhase,
} from "./game-load";

type UseGameLoadGateOptions = {
  /** true：需使用者點「開始」才進入 loading（大型 Godot WASM 等） */
  manualStart?: boolean;
  loadTimeoutMs?: number;
};

/**
 * 遊戲載入狀態機：idle → loading → ready | timeout | error。
 * 宿主元件負責實際載入工作，並呼叫 markReady / markError / setProgress。
 */
export function useGameLoadGate(options: UseGameLoadGateOptions = {}) {
  const manualStart = options.manualStart ?? false;
  const loadTimeoutMs = options.loadTimeoutMs ?? DEFAULT_GAME_LOAD_TIMEOUT_MS;

  const [phase, setPhase] = useState<GameLoadPhase>(
    manualStart ? "idle" : "loading",
  );
  const [progress, setProgress] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  const start = useCallback(() => {
    setProgress(null);
    setPhase("loading");
    setAttempt((a) => a + 1);
  }, []);

  const retry = start;

  const markReady = useCallback(() => {
    setPhase("ready");
    setProgress(100);
  }, []);

  const markReadyIfLoading = useCallback(() => {
    setPhase((current) => (current === "loading" ? "ready" : current));
    setProgress(100);
  }, []);

  const markError = useCallback(() => {
    setPhase("error");
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => {
      setPhase((current) => (current === "loading" ? "timeout" : current));
    }, loadTimeoutMs);
    return () => clearTimeout(timer);
  }, [phase, attempt, loadTimeoutMs]);

  return {
    phase,
    progress,
    setProgress,
    start,
    retry,
    attempt,
    markReady,
    markReadyIfLoading,
    markError,
  };
}
