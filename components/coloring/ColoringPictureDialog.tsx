/* eslint-disable @next/next/no-img-element -- 畫布縮圖是本機 data URL */
"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import styles from "./ColoringPictureDialog.module.css";

export type PictureAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone: "stay" | "go" | "danger";
  disabled?: boolean;
};

type ColoringPictureDialogProps = {
  /** 讀螢幕用的對話名稱；畫面上不靠這句字操作。 */
  label: string;
  thumbnailUrl?: string | null;
  actions: readonly PictureAction[];
  error?: string;
};

/**
 * 不識字也能選的確認：大圖是安全的那個（留下來），
 * 離開或清掉放小一號、分開，避免和主按鈕擠在一起。
 */
export function ColoringPictureDialog({
  label,
  thumbnailUrl,
  actions,
  error,
}: ColoringPictureDialogProps) {
  const titleId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  const stay = actions.find((action) => action.tone === "stay") ?? actions[0];
  const rest = actions.filter((action) => action !== stay);
  const stayClick = useRef(stay?.onClick);
  stayClick.current = stay?.onClick;
  useFocusTrap(true, sheetRef);

  useEffect(() => {
    stayRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") stayClick.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <h2 id={titleId} className={styles.srOnly}>
          {label}
        </h2>
        {thumbnailUrl ? (
          <img className={styles.thumb} src={thumbnailUrl} alt="" aria-hidden="true" />
        ) : null}
        {stay ? (
          <button
            ref={stayRef}
            type="button"
            className={`${styles.action} ${styles.stay}`}
            onClick={stay.onClick}
            disabled={stay.disabled}
          >
            <span className={styles.icon} aria-hidden="true">
              {stay.icon}
            </span>
            <span className={styles.srOnly}>{stay.label}</span>
          </button>
        ) : null}
        {rest.length > 0 ? (
          <div className={styles.rest}>
            {rest.map((action) => (
              <button
                key={action.label}
                type="button"
                className={`${styles.action} ${styles[action.tone]}`}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <span className={styles.icon} aria-hidden="true">
                  {action.icon}
                </span>
                <span className={styles.srOnly}>{action.label}</span>
              </button>
            ))}
          </div>
        ) : null}
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      </div>
    </div>
  );
}
