"use client";

import { COLORING_HINT_DRAW, COLORING_HINT_FILL } from "@/lib/coloring/flow";
import { BucketIcon, CrayonIcon } from "./ColoringToolbarIcons";
import styles from "./ColoringHint.module.css";

type ColoringHintProps = {
  step: "draw" | "fill";
  /** 目前選的顏色：提示裡的色點跟著變，孩子看得出「先選色」。 */
  colorHex: string;
  className?: string;
};

/**
 * 畫布旁的開場提示：圖示會動，給還不識字的孩子看；
 * 原句縮成一行小字給大人，也當讀螢幕軟體的說明。
 */
export function ColoringHint({ step, colorHex, className }: ColoringHintProps) {
  const text = step === "fill" ? COLORING_HINT_FILL : COLORING_HINT_DRAW;
  return (
    <p
      className={`${styles.hint} ${className ?? ""}`}
      data-testid="coloring-open-hint"
      data-step={step}
    >
      <span className={styles.icons} aria-hidden="true">
        {step === "draw" ? (
          <>
            <span className={styles.dot} style={{ background: colorHex }} />
            <span className={styles.arrow} />
            <CrayonIcon className={`${styles.icon} ${styles.wiggle}`} />
          </>
        ) : (
          <span className={styles.tap}>
            <BucketIcon className={styles.icon} />
            <span className={styles.ripple} />
          </span>
        )}
      </span>
      <span className={styles.text}>{text}</span>
    </p>
  );
}
