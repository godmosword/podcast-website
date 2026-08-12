"use client";

import Image from "next/image";
import type { GameLoadPhase } from "@/lib/gamekit/react/game-load";
import DuduMoment from "@/components/dudu/DuduMoment";
import { IconReplay } from "@/components/games/ClayIcons";
import styles from "./GameLoadOverlay.module.css";

type GameLoadOverlayProps = {
  phase: GameLoadPhase;
  title: string;
  hint?: string;
  onStart?: () => void;
  onRetry?: () => void;
  startLabel?: string;
  /** idle 階段的次要按鈕（例如「怎麼玩？」教學）。 */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** true：用於 GameLoadingGate 等全幅區塊 */
  staticLayout?: boolean;
  artSrc?: string;
  artAlt?: string;
  className?: string;
};

/**
 * GameKit 遊戲共用的載入／開始／重試 overlay。
 */
export function GameLoadOverlay({
  phase,
  title,
  hint,
  onStart,
  onRetry,
  startLabel = "開始遊戲",
  secondaryLabel,
  onSecondary,
  staticLayout = false,
  artSrc,
  artAlt = "",
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
      {artSrc ? (
        <Image
          src={artSrc}
          alt={artAlt}
          fill
          sizes="(max-width: 640px) 100vw, 720px"
          className={styles.art}
          aria-hidden={artAlt.length === 0}
        />
      ) : null}
      <span className={styles.artShade} aria-hidden />
      {phase === "idle" && onStart ? (
        <>
          <p className={styles.title}>{title}</p>
          {hint ? <p className={styles.hint}>{hint}</p> : null}
          <button type="button" className={styles.startBtn} onClick={onStart}>
            {startLabel}
          </button>
          {onSecondary && secondaryLabel ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSecondary}
            >
              {secondaryLabel}
            </button>
          ) : null}
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
            aria-label="載入進度"
          >
            <div className={`${styles.progressFill} ${styles.progressIndeterminate}`} />
          </div>
        </>
      ) : null}

      {phase === "timeout" && onRetry ? (
        <>
          <p className={styles.title}>載入花太久了</p>
          <p className={styles.hint}>網路可能較慢，再試一次看看</p>
          <button type="button" className={styles.retryBtn} onClick={onRetry}>
            <IconReplay size={18} /> 再試一次
          </button>
        </>
      ) : null}
    </div>
  );
}
