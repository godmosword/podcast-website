"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildSnowboardConfigMessage,
  buildSnowboardControlMessage,
  isSnowboardFinishMessage,
  isSnowboardReadyMessage,
  snowboardSessionFromFinish,
  type SnowboardConfigMessage,
} from "@/lib/gamekit/games/snowboard-bridge";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { requestCelebration } from "@/lib/celebration";
import { playSfx } from "@/lib/sfx";
import type { OverlayProps } from "@/lib/gamekit/adapter";
import type { GameSessionResult } from "@/lib/gamekit/progress/session";
import { snowboardIframeSrc } from "@/lib/games/snowboard/iframe-src";
import { useGameLoadGate } from "@/lib/gamekit/react/useGameLoadGate";
import {
  readGodotLoaderError,
  readGodotLoaderProgress,
} from "@/lib/gamekit/react/game-load";
import { GameEndStation } from "@/components/games/GameEndStation";
import { GameLoadOverlay } from "@/components/games/GameLoadOverlay";
import styles from "./SnowboardIframeHost.module.css";
import type { SnowboardInstance } from "@/lib/gamekit/games/snowboard/adapter";

const LOAD_TIMEOUT_MS = 45_000;
const GODOT_PROGRESS_POLL_MS = 150;

export type SnowboardController = {
  startLoad(): void;
  retry(): void;
  sendConfig(message: SnowboardConfigMessage): void;
  sendControl(action: "pause" | "resume"): void;
};

export type SnowboardViewProps = OverlayProps & {
  instance: SnowboardInstance;
  iframeTitle?: string;
  className?: string;
};

export function SnowboardView({
  instance,
  syncHost,
  onOpenTutorial,
  gameVolume,
  soundOn,
  snowboardDifficulty,
  reducedMotion,
  iframeTitle = "阿蹦雪山衝刺遊戲",
  className,
}: SnowboardViewProps) {
  const [resolvedSrc, setResolvedSrc] = useState(() => snowboardIframeSrc());
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoadedRef = useRef(false);
  const reportedRef = useRef<string | null>(null);
  const [endSession, setEndSession] = useState<GameSessionResult | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setResolvedSrc(
      snowboardIframeSrc(
        params.get("debugFinish") ?? undefined,
        params.get("visualStage") ?? undefined,
        params.get("visualPose") ?? undefined,
      ),
    );
  }, []);

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
  } = useGameLoadGate({ manualStart: true, loadTimeoutMs: LOAD_TIMEOUT_MS });

  const buildConfig = useCallback(
    () =>
      buildSnowboardConfigMessage({
        difficulty: snowboardDifficulty,
        volume: soundOn ? gameVolume : 0,
        reducedMotion,
        unlockedCourseIds:
          loadPlayerProfile().snowboardCoursesUnlocked as SnowboardConfigMessage["unlockedCourseIds"],
      }),
    [gameVolume, reducedMotion, snowboardDifficulty, soundOn],
  );

  const postConfig = useCallback(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    target.postMessage(buildConfig(), window.location.origin);
  }, [buildConfig]);

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (isSnowboardReadyMessage(event.data)) {
        markReady();
        instance.notifyLoaded();
        postConfig();
        syncHost();
        return;
      }
      if (!isSnowboardFinishMessage(event.data)) return;
      const key = `${event.data.runId}:${event.data.courseId}:${event.data.score}`;
      if (reportedRef.current === key) return;
      reportedRef.current = key;
      const session = snowboardSessionFromFinish(event.data);
      instance.notifyFinish(session);
      setEndSession(session);
      syncHost();
      const decision = requestCelebration("game_race_finish");
      if (decision.playSfx) playSfx(decision.playSfx);
    },
    [instance, markReady, postConfig, syncHost],
  );

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  useEffect(() => {
    if (phase !== "loading") return;
    const poll = () => {
      const doc = iframeRef.current?.contentDocument;
      const percent = readGodotLoaderProgress(doc);
      if (percent != null) setProgress(percent);
      if (readGodotLoaderError(doc)) markError();
    };
    poll();
    const timer = window.setInterval(poll, GODOT_PROGRESS_POLL_MS);
    return () => window.clearInterval(timer);
  }, [attempt, markError, phase, setProgress]);

  const handleRetry = useCallback(() => {
    reportedRef.current = null;
    iframeLoadedRef.current = false;
    setEndSession(null);
    instance.notifyReady();
    retry();
    syncHost();
  }, [instance, retry, syncHost]);

  const handleReplay = useCallback(() => {
    handleRetry();
  }, [handleRetry]);

  const sendControl = useCallback((action: "pause" | "resume") => {
    iframeRef.current?.contentWindow?.postMessage(
      buildSnowboardControlMessage(action),
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    instance.registerController({
      startLoad: start,
      retry: handleRetry,
      sendConfig: (message) =>
        iframeRef.current?.contentWindow?.postMessage(message, window.location.origin),
      sendControl,
    });
    return () => instance.registerController({
      startLoad: () => undefined,
      retry: () => undefined,
      sendConfig: () => undefined,
      sendControl: () => undefined,
    });
  }, [handleRetry, instance, sendControl, start]);

  useEffect(() => {
    if (phase !== "ready") return;
    postConfig();
  }, [gameVolume, postConfig, phase, reducedMotion, snowboardDifficulty, soundOn]);

  const onIframeLoad = () => {
    if (iframeLoadedRef.current) return;
    iframeLoadedRef.current = true;
    window.setTimeout(() => markReadyIfLoading(), 1_500);
  };

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
        title={phase === "loading" ? "雪道準備中…" : "阿蹦雪山衝刺"}
        hint={
          phase === "idle"
            ? "首次載入會下載雪道引擎，準備好就出發！"
            : phase === "loading"
              ? "正在鋪好糖霜雪峰，等一下下 🏂"
              : undefined
        }
        progress={phase === "loading" ? progress : null}
        onStart={start}
        onRetry={handleRetry}
        startLabel="出發！開始滑雪"
        secondaryLabel="怎麼玩？"
        onSecondary={onOpenTutorial}
        artSrc="/games/v2/snowboard/cover.webp"
        artAlt="阿蹦在雪山上準備踩滑雪板出發"
      />
      {endSession ? (
        <div className={styles.endOverlay}>
          <GameEndStation
            mood="win"
            title="衝過終點了！"
            scoreLabel={`分數 ${endSession.score} · 特技 ${endSession.trickScore ?? 0}`}
            stars={
              (endSession.cleared ? 1 : 0) +
              (endSession.flawless ? 1 : 0) +
              (endSession.collectedAll ? 1 : 0)
            }
            onReplay={handleReplay}
            replayLabel="再滑一次"
            gameSlug="snowboard"
          />
        </div>
      ) : null}
    </div>
  );
}
