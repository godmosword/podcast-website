"use client";

import type { GameLoadPhase } from "@/lib/gamekit/react/game-load";
import DuduMoment from "@/components/dudu/DuduMoment";
import { IconReplay } from "@/components/games/ClayIcons";
import styles from "./GameLoadOverlay.module.css";

type GameLoadOverlayProps = {
  phase: GameLoadPhase;
  title: string;
  hint?: string;
  /** 0–100；null 表示不確定進度 */
  progress?: number | null;
  onStart?: () => void;
  onRetry?: () => void;
  startLabel?: string;
  /** true：用於 GameLoadingGate 等非 iframe 全幅區塊 */
  staticLayout?: boolean;
  className?: string;
};

/**
 * 四款遊戲共用的載入／開始／重試 overlay。
 */
export function GameLoadOverlay({
  phase,
  title,
  hint,
  progress = null,
  onStart,
  onRetry,
  startLabel = "開始遊戲",
  staticLayout = false,
  className,
}: GameLoadOverlayProps) {
  const wrapClass = [
    styles.overlay,
    staticLayout ? styles.overlayStatic : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  if (phase === "ready") return null;

  return (
    <div
      className={wrapClass}
      role="status"
      aria-live="polite"
      aria-busy={phase === "loading"}
      aria-label={title}
    >
      {phase === "idle" && onStart ? (
        <>
          <p className={styles.title}>{title}</p>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
          <button type="button" className={styles.startBtn} onClick={onStart}>
            {startLabel}
          </button>
        </>
      ) : null}

      {phase === "loading" ? (
        <>
          <DuduMoment variant="badge" emotion="star" label="遊戲載入中" />
          <div className={styles.spinner} aria-hidden />
          <p className={styles.title}>{title}</p>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? undefined}
            aria-label="載入進度"
          >
            <div
              className={`${styles.progressFill}${
                progress == null ? ` ${styles.progressIndeterminate}` : ""
              }`}
              style={progress != null ? { width: `${progress}%` } : undefined}
            />
          </div>
          {progress != null ? (
            <p className={styles.progressLabel}>{progress}%</p>
          ) : null}
        </>
      ) : null}

      {(phase === "timeout" || phase === "error") && onRetry ? (
        <>
          <p className={styles.title}>
            {phase === "timeout" ? "載入花太久了" : "載入失敗"}
          </p>
          <p className={styles.hint}>
            {phase === "timeout"
              ? "網路可能較慢，再試一次看看"
              : "請確認網路連線後重試"}
          </p>
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            <IconReplay size={18} /> 再試一次
          </button>
        </>
      ) : null}
    </div>
  );
}
