"use client";

import styles from "./SaveRetryNotice.module.css";

export type SaveRetryNoticeProps = {
  /** 例如「這一關沒存好。」；給大人看的，孩子照樣能按主鈕繼續玩。 */
  message: string;
  onRetry: () => void;
};

/**
 * 存檔寫不進去（localStorage 滿了）時的提示。DOM 要排在主鈕後面：
 * 結算一開焦點仍在主鈕，Enter 不會按到「再存一次」。
 */
export function SaveRetryNotice({ message, onRetry }: SaveRetryNoticeProps) {
  return (
    <p className={styles.notice} role="alert" data-testid="save-retry-notice">
      <span>{message}</span>
      <button type="button" className={styles.retry} onClick={onRetry}>
        再存一次
      </button>
    </p>
  );
}
