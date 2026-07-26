"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  candyKartSessionFromFinish,
  isCandyKartFinishMessage,
  isCandyKartReadyMessage,
} from "@/lib/gamekit/games/candy-kart-bridge";
import {
  buildCelebrationIframeMessage,
  celebrationEventFromKartFinish,
} from "@/lib/celebration-iframe";
import { requestCelebration } from "@/lib/celebration";
import { playSfx } from "@/lib/sfx";
import {
  readGodotLoaderError,
  readGodotLoaderProgress,
} from "@/lib/gamekit/react/game-load";
import { candyKartIframeSrc } from "@/lib/games/candy-kart/iframe-src";
import { useGameLoadGate } from "@/lib/gamekit/react/useGameLoadGate";
import type { OverlayProps } from "@/lib/gamekit/adapter";
import { GameLoadOverlay } from "@/components/games/GameLoadOverlay";
import type { CandyKartInstance } from "@/lib/gamekit/games/candy-kart/adapter";
import styles from "./CandyKartIframeHost.module.css";

const LOAD_TIMEOUT_MS = 45_000;
const GODOT_PROGRESS_POLL_MS = 150;

export type CandyKartController = {
  startLoad(): void;
  retry(): void;
};

export type CandyKartViewProps = OverlayProps & {
  instance: CandyKartInstance;
  iframeTitle?: string;
  className?: string;
};

/**
 * 繽紛卡丁車（Godot Web export）DOM overlay：
 * - 按需載入：進頁不拉 WASM，點「開始遊戲」才掛 iframe
 * - race-finish → instance.notifyFinish → Host onSession
 * - postMessage 契約見 candy-kart-bridge（dual-accept 護欄）
 */
export function CandyKartView({
  instance,
  syncHost,
  onOpenTutorial,
  iframeTitle = "繽紛卡丁車遊戲",
  className,
}: CandyKartViewProps) {
  const [resolvedSrc] = useState(() => {
    if (typeof window === "undefined") return candyKartIframeSrc();
    const debugFinish = new URLSearchParams(window.location.search).get(
      "debugFinish",
    );
    return candyKartIframeSrc(debugFinish ?? undefined);
  });
  const reportedRef = useRef<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoadedRef = useRef(false);

  const {
    phase,
    progress,
    setProgress,
    start,
    retry,
    attempt,
    markReady,
    markReadyIfLoading,
    markError,
  } = useGameLoadGate({
    manualStart: true,
    loadTimeoutMs: LOAD_TIMEOUT_MS,
  });

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (isCandyKartReadyMessage(event.data)) {
        markReady();
        instance.notifyLoaded();
        syncHost();
        return;
      }
      if (!isCandyKartFinishMessage(event.data)) return;

      const key = `${event.data.trackId}:${event.data.totalMs}:${event.data.playerPos}`;
      if (reportedRef.current === key) return;
      reportedRef.current = key;

      const session = candyKartSessionFromFinish(event.data);
      instance.notifyFinish(session);
      syncHost();

      const eventId = celebrationEventFromKartFinish(event.data);
      const decision = requestCelebration(eventId);
      if (decision.playSfx) playSfx(decision.playSfx);
      iframeRef.current?.contentWindow?.postMessage(
        buildCelebrationIframeMessage(eventId, decision.intensity),
        window.location.origin,
      );
    },
    [markReady, instance, syncHost],
  );

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  // 只觸發 load gate；勿呼叫 props.onStart（會再進 instance.start → 遞迴）。
  const handleStartLoad = useCallback(() => {
    start();
  }, [start]);

  const handleRetry = useCallback(() => {
    reportedRef.current = null;
    iframeLoadedRef.current = false;
    retry();
    instance.notifyReady();
    syncHost();
  }, [retry, instance, syncHost]);

  useEffect(() => {
    instance.registerController({
      startLoad: handleStartLoad,
      retry: handleRetry,
    });
    return () => {
      instance.registerController({
        startLoad: () => undefined,
        retry: () => undefined,
      });
    };
  }, [instance, handleStartLoad, handleRetry]);

  const onIframeLoad = () => {
    if (iframeLoadedRef.current) return;
    iframeLoadedRef.current = true;
    // 後援：Godot 端尚未送 ready 時，iframe load 後短暫緩衝即視為就緒
    setTimeout(() => {
      markReadyIfLoading();
    }, 1_500);
  };

  // 輪詢 Godot 內建 progress bar（同源 iframe）
  useEffect(() => {
    if (phase !== "loading") return;
    const poll = () => {
      const doc = iframeRef.current?.contentDocument;
      const pct = readGodotLoaderProgress(doc);
      if (pct != null) setProgress(pct);
      const err = readGodotLoaderError(doc);
      if (err) markError();
    };
    poll();
    const timer = window.setInterval(poll, GODOT_PROGRESS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [phase, attempt, markError, setProgress]);

  const shouldMountIframe = phase !== "idle";

  return (
    <div className={`${styles.wrap}${className ? ` ${className}` : ""}`}>
      {shouldMountIframe ? (
        <iframe
          key={attempt}
          ref={iframeRef}
          title={iframeTitle}
          src={resolvedSrc}
          className={styles.frame}
          allow="autoplay; gamepad *"
          loading="lazy"
          onLoad={onIframeLoad}
        />
      ) : (
        <div className={styles.framePlaceholder} aria-hidden />
      )}
      <GameLoadOverlay
        phase={phase}
        title={
          phase === "idle"
            ? "繽紛卡丁車"
            : phase === "loading"
              ? "賽道準備中…"
              : "繽紛卡丁車"
        }
        hint={
          phase === "idle"
            ? "第一次載入約需 30 秒，點下方按鈕再開始下載"
            : phase === "loading"
              ? "正在載入賽道與引擎，等一下下 🍬"
              : undefined
        }
        progress={phase === "loading" ? progress : null}
        onStart={handleStartLoad}
        onRetry={handleRetry}
        startLabel="出發！開始遊戲"
        secondaryLabel="怎麼玩？"
        onSecondary={onOpenTutorial}
        artSrc="/games/v2/candy-kart/cover.webp"
        artAlt="粉紅黏土卡丁車在遊樂園賽道上準備出發"
      />
    </div>
  );
}
