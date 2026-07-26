"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSnowboardFinishMessage,
  isSnowboardReadyMessage,
  snowboardSessionFromFinish,
} from "@/lib/gamekit/games/snowboard-bridge";
import { requestCelebration } from "@/lib/celebration";
import { playSfx } from "@/lib/sfx";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import {
  readGodotLoaderError,
  readGodotLoaderProgress,
} from "@/lib/gamekit/react/game-load";
import { snowboardIframeSrc } from "@/lib/games/snowboard/iframe-src";
import { useGameLoadGate } from "@/lib/gamekit/react/useGameLoadGate";
import { TutorialOverlay } from "@/lib/gamekit/react/TutorialOverlay";
import { GameLoadOverlay } from "@/components/games/GameLoadOverlay";
import { GAMES } from "@/data/games";
import styles from "./SnowboardIframeHost.module.css";

const SNOWBOARD_META = GAMES.find((game) => game.slug === "snowboard");
const LOAD_TIMEOUT_MS = 45_000;
const GODOT_PROGRESS_POLL_MS = 150;

type SnowboardIframeHostProps = {
  src: string;
  title: string;
  className?: string;
};

export function SnowboardIframeHost({
  src,
  title,
  className,
}: SnowboardIframeHostProps) {
  const [resolvedSrc] = useState(() => {
    if (typeof window === "undefined") return src;
    const debugFinish = new URLSearchParams(window.location.search).get(
      "debugFinish",
    );
    const pageParams = new URLSearchParams(window.location.search);
    return snowboardIframeSrc(
      debugFinish ?? undefined,
      pageParams.get("visualStage") ?? undefined,
      pageParams.get("visualPose") ?? undefined,
    );
  });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoadedRef = useRef(false);
  const reportedRef = useRef<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

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

  const onMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (isSnowboardReadyMessage(event.data)) {
        markReady();
        return;
      }
      if (!isSnowboardFinishMessage(event.data)) return;

      const key = `${event.data.courseId}:${event.data.totalMs}:${event.data.falls}:${event.data.snowflakesCollected}`;
      if (reportedRef.current === key) return;
      reportedRef.current = key;
      reportGameSession(snowboardSessionFromFinish(event.data));
      const decision = requestCelebration("game_race_finish");
      if (decision.playSfx) playSfx(decision.playSfx);
    },
    [markReady],
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

  const handleRetry = () => {
    reportedRef.current = null;
    iframeLoadedRef.current = false;
    retry();
  };

  const handleIframeLoad = () => {
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
          title={title}
          src={resolvedSrc}
          className={styles.frame}
          allow="autoplay; gamepad *"
          loading="lazy"
          onLoad={handleIframeLoad}
        />
      ) : (
        <div className={styles.framePlaceholder} aria-hidden />
      )}
      <GameLoadOverlay
        phase={phase}
        title={phase === "loading" ? "雪道準備中…" : "阿蹦雪山衝刺"}
        hint={
          phase === "idle"
            ? "第一次載入約需 30 秒，點下方按鈕再開始下載"
            : phase === "loading"
              ? "正在鋪好糖霜雪峰，等一下下 🏂"
              : undefined
        }
        progress={phase === "loading" ? progress : null}
        onStart={start}
        onRetry={handleRetry}
        startLabel="出發！開始滑雪"
        secondaryLabel="怎麼玩？"
        onSecondary={() => setShowTutorial(true)}
        artSrc="/games/v2/snowboard/cover.webp"
        artAlt="阿蹦在雪山上準備踩滑雪板出發"
      />
      {showTutorial && (
        <TutorialOverlay
          title={SNOWBOARD_META?.title ?? "阿蹦雪山衝刺"}
          steps={SNOWBOARD_META?.tutorial ?? []}
          onClose={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
}
