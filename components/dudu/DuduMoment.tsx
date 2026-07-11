"use client";

import type { ReactNode } from "react";
import type { DuduEmotion } from "@/data/dudu-emotions";
import { DUDU_EMOTION_LABEL } from "@/data/dudu-emotions";
import DuduSprite from "./DuduSprite";
import styles from "./DuduMoment.module.css";

type DuduMomentVariant = "inline" | "badge" | "companion";

type DuduMomentProps = {
  emotion: DuduEmotion;
  /** 無障礙標籤（互動或裝飾說明）。 */
  label: string;
  variant?: DuduMomentVariant;
  /** 可點擊時提供；預設裝飾。 */
  interactive?: boolean;
  onInteract?: () => void;
  children?: ReactNode;
  className?: string;
  hidden?: boolean;
};

/**
 * 嘟嘟情境 wrapper：404／載入／完播／角落夥伴等共用。
 * 互動時 tabIndex=0（UX-P2-4）。
 */
export default function DuduMoment({
  emotion,
  label,
  variant = "inline",
  interactive = false,
  onInteract,
  children,
  className,
  hidden = false,
}: DuduMomentProps) {
  const rootClass = [
    styles.root,
    styles[variant],
    hidden ? styles.hidden : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const sprite = <DuduSprite emotion={emotion} decorative={!interactive} />;

  if (interactive) {
    return (
      <div className={rootClass}>
        <button
          type="button"
          className={styles.interactive}
          onClick={onInteract}
          aria-label={`${label}：${DUDU_EMOTION_LABEL[emotion]}`}
        >
          <span className={styles.frame}>{sprite}</span>
        </button>
        {children ? <p className={styles.caption}>{children}</p> : null}
      </div>
    );
  }

  return (
    <div className={rootClass} role="img" aria-label={`${label}：${DUDU_EMOTION_LABEL[emotion]}`}>
      <span className={styles.frame}>{sprite}</span>
      {children ? <p className={styles.caption}>{children}</p> : null}
    </div>
  );
}
