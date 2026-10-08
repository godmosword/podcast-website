/* eslint-disable @next/next/no-img-element -- 畫布縮圖是本機 data URL */
"use client";

import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { ClearIcon, CrayonIcon } from "./ColoringToolbarIcons";
import styles from "./ColoringLeaveSheet.module.css";

type ColoringLeaveSheetProps = {
  thumbnailUrl: string | null;
  busy: boolean;
  error: string;
  onSave: () => void;
  onStay: () => void;
  onDiscard: () => void;
};

/**
 * 塗了還沒收起來就要離開時問一次：收起來／繼續塗／不要了。
 * 3–7 歲看圖示就懂，字只有三個；預設焦點在「繼續塗」，Esc 也是繼續塗。
 */
export function ColoringLeaveSheet({
  thumbnailUrl,
  busy,
  error,
  onSave,
  onStay,
  onDiscard,
}: ColoringLeaveSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const stayRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(true, sheetRef);

  useEffect(() => {
    stayRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onStay();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onStay]);

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="coloring-leave-title"
      >
        {thumbnailUrl ? (
          <img className={styles.thumb} src={thumbnailUrl} alt="" aria-hidden="true" />
        ) : null}
        <h2 id="coloring-leave-title" className={styles.title}>
          還沒收起來喔
        </h2>
        <div className={styles.actions}>
          <button type="button" className={styles.save} onClick={onSave} disabled={busy}>
            <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                className={styles.star}
                d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.5L12 17.2 6.1 20.4l1.3-6.5L2.5 9.3l6.6-.8z"
              />
            </svg>
            收起來
          </button>
          <button ref={stayRef} type="button" className={styles.stay} onClick={onStay}>
            <CrayonIcon className={styles.icon} />
            繼續塗
          </button>
          <button type="button" className={styles.discard} onClick={onDiscard} disabled={busy}>
            <ClearIcon className={styles.icon} />
            不要了
          </button>
        </div>
        <p className={styles.error} role="status" aria-live="polite">
          {error}
        </p>
      </div>
    </div>
  );
}
