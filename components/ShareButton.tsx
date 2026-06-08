"use client";

import { useState } from "react";
import styles from "./ShareButton.module.css";

type ShareButtonProps = {
  shareUrl: string;
  lineUrl: string;
};

export default function ShareButton({ shareUrl, lineUrl }: ShareButtonProps) {
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
    <div className={styles.row} aria-label="分享這集">
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
      >
        LINE 分享
      </a>
    </div>
  );
}
