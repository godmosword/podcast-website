"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  isKartRaceFinishMessage,
  kartScoreFromTotalMs,
} from "@/lib/gamekit/iframe-bridge";
import { reportGameSession } from "@/lib/gamekit/session";

type KartIframeHostProps = {
  src: string;
  title: string;
  className?: string;
};

export function KartIframeHost({ src, title, className }: KartIframeHostProps) {
  const reportedRef = useRef<string | null>(null);

  const onMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (!isKartRaceFinishMessage(event.data)) return;

    const key = `${event.data.trackId}:${event.data.totalMs}:${event.data.playerPos}`;
    if (reportedRef.current === key) return;
    reportedRef.current = key;

    reportGameSession({
      gameId: "kart",
      score: kartScoreFromTotalMs(event.data.totalMs),
    });
  }, []);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  return (
    <iframe
      title={title}
      src={src}
      className={className}
      allow="autoplay; gamepad *"
      loading="eager"
    />
  );
}
