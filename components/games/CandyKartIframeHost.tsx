"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  candyKartSessionFromFinish,
  isCandyKartFinishMessage,
  isCandyKartReadyMessage,
} from "@/lib/gamekit/games/candy-kart-bridge";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import { IconReplay } from "@/components/games/ClayIcons";
import styles from "./CandyKartIframeHost.module.css";

const LOAD_TIMEOUT_MS = 30_000;

type CandyKartIframeHostProps = {
  src: string;
  title: string;
  className?: string;
};

type LoadState = "loading" | "ready" | "timeout";

/**
 * 繽紛卡丁車（Godot Web export）iframe 宿主：
 * - 監聽 race-finish → 換算分數/三星 → reportGameSession()
 * - Godot wasm 首載慢：loading 畫面 + 逾時提示 + 重新載入按鈕
 * - 收到遊戲端 ready 訊息（或 iframe load 後援）即關閉 loading
 */
export function CandyKartIframeHost({
  src,
  title,
  className,
}: CandyKartIframeHostProps) {
  const reportedRef = useRef<string | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const iframeLoadedRef = useRef(false);

  const onMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    if (isCandyKartReadyMessage(event.data)) {
      setLoadState("ready");
      return;
    }
    if (!isCandyKartFinishMessage(event.data)) return;

    const key = `${event.data.trackId}:${event.data.totalMs}:${event.data.playerPos}`;
    if (reportedRef.current === key) return;
    reportedRef.current = key;

    reportGameSession(candyKartSessionFromFinish(event.data));
  }, []);

  useEffect(() => {
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onMessage]);

  useEffect(() => {
    if (loadState !== "loading") return;
    const timer = setTimeout(() => {
      setLoadState((s) => (s === "loading" ? "timeout" : s));
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loadState, reloadKey]);

  const reload = () => {
    reportedRef.current = null;
    iframeLoadedRef.current = false;
    setLoadState("loading");
    setReloadKey((k) => k + 1);
  };

  // 後援：Godot 端尚未實作 ready 訊息時，iframe onLoad 後短暫緩衝即視為就緒
  const onIframeLoad = () => {
    if (iframeLoadedRef.current) return;
    iframeLoadedRef.current = true;
    setTimeout(() => {
      setLoadState((s) => (s === "loading" ? "ready" : s));
    }, 1_500);
  };

  return (
    <div className={`${styles.wrap}${className ? ` ${className}` : ""}`}>
      <iframe
        key={reloadKey}
        title={title}
        src={src}
        className={styles.frame}
        allow="autoplay; gamepad *"
        loading="eager"
        onLoad={onIframeLoad}
      />
      {loadState !== "ready" && (
        <div className={styles.overlay} role="status">
          {loadState === "loading" ? (
            <>
              <div className={styles.spinner} aria-hidden />
              <p className={styles.overlayText}>賽道準備中…</p>
              <p className={styles.overlayHint}>第一次載入比較久，等一下下 🍬</p>
            </>
          ) : (
            <>
              <p className={styles.overlayText}>載入花太久了</p>
              <button type="button" className={styles.reloadBtn} onClick={reload}>
                <IconReplay size={18} /> 再試一次
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
