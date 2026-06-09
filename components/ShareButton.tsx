"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { LINE_ICON_PATH } from "@/lib/connect-icons";
import styles from "./ShareButton.module.css";

type ShareButtonProps = {
  shareUrl: string;
  lineUrl: string;
  /** 分享列最左側插槽（例：收藏愛心） */
  leading?: ReactNode;
};

export default function ShareButton({
  shareUrl,
  lineUrl,
  leading,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // 剪貼簿不可用時靜默；使用者仍可長按選取。
    }
  }

  return (
    <div
      className={styles.row}
      aria-label={leading ? "故事操作" : "分享這集"}
    >
      {leading}
      <button
        type="button"
        className={styles.btn}
        onClick={copyLink}
        aria-live="polite"
      >
        {copied ? "✓ 已複製連結" : "🔗 複製連結"}
      </button>
      <a
        href={lineUrl}
        className={`${styles.btn} ${styles.line}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="以 LINE 分享"
        title="以 LINE 分享"
      >
        <svg
          viewBox="0 0 24 24"
          className={styles.lineIcon}
          fill="currentColor"
          aria-hidden
          focusable="false"
          role="img"
        >
          {LINE_ICON_PATH}
        </svg>
        <span className={styles.lineText}>LINE</span>
      </a>
    </div>
  );
}
