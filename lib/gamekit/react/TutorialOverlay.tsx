"use client";

import { useEffect, useId, useRef } from "react";
import type { TutorialStep } from "@/data/games";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./tutorial-overlay.module.css";

export type TutorialOverlayProps = {
  /** 遊戲名稱，用於標題「怎麼玩：{title}」。 */
  title: string;
  steps: readonly TutorialStep[];
  onClose: () => void;
};

/**
 * 手勢示範圖示：純 inline SVG＋CSS keyframes，不識字兒童也看得懂。
 * aria-hidden——文字說明才是可讀內容。
 */
function GestureDemo({ gesture }: { gesture: TutorialStep["gesture"] }) {
  switch (gesture) {
    case "tap":
      return (
        <svg viewBox="0 0 64 64" className={styles.demoSvg} aria-hidden focusable="false">
          <circle className={styles.tapRing} cx="32" cy="34" r="14" />
          <circle className={styles.fingerDot} cx="32" cy="34" r="9" />
          <path d="M32 14v10" className={styles.fingerStem} />
        </svg>
      );
    case "swipe":
      return (
        <svg viewBox="0 0 64 64" className={styles.demoSvg} aria-hidden focusable="false">
          <path d="M12 34h40" className={styles.swipeTrack} />
          <path d="M42 26l8 8-8 8" className={styles.swipeArrow} />
          <circle className={`${styles.fingerDot} ${styles.swipeFinger}`} cx="20" cy="34" r="9" />
        </svg>
      );
    case "hold":
      return (
        <svg viewBox="0 0 64 64" className={styles.demoSvg} aria-hidden focusable="false">
          <circle className={styles.holdRing} cx="32" cy="34" r="15" />
          <circle className={styles.fingerDot} cx="32" cy="34" r="9" />
        </svg>
      );
    case "arrows":
      return (
        <svg viewBox="0 0 64 64" className={styles.demoSvg} aria-hidden focusable="false">
          <rect className={styles.keyLeft} x="8" y="26" width="16" height="16" rx="4" />
          <rect className={styles.keyRight} x="40" y="26" width="16" height="16" rx="4" />
          <path d="M19 30l-5 4 5 4" className={styles.keyGlyph} />
          <path d="M45 30l5 4-5 4" className={styles.keyGlyph} />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * 首玩教學示範 overlay：圖示化操作示範，不寫入 localStorage，
 * 每次進遊戲從開始畫面可再看一次。
 */
export function TutorialOverlay({ title, steps, onClose }: TutorialOverlayProps) {
  const reduced = useReducedMotion();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-reduced-motion={reduced ? "true" : undefined}
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="關閉教學"
        >
          ✕
        </button>
        <h2 id={titleId} className={styles.title}>
          怎麼玩：{title}
        </h2>
        <ol className={styles.steps}>
          {steps.map((step, i) => (
            <li key={i} className={styles.step}>
              <div className={styles.demo} aria-hidden="true">
                <GestureDemo gesture={step.gesture} />
              </div>
              <p className={styles.stepText}>{step.text}</p>
            </li>
          ))}
        </ol>
        <button type="button" className={styles.startBtn} onClick={onClose}>
          開始玩！
        </button>
      </div>
    </div>
  );
}
