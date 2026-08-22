"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { trackShareClick } from "@/lib/analytics";
import styles from "./ShareButton.module.css";

type ShareButtonProps = {
  shareUrl: string;
  lineUrl: string;
  /** 供分享點擊事件（D12）；無 slug 則不送 analytics。 */
  storySlug?: string;
  leading?: ReactNode;
  className?: string;
};

function LinkIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} aria-hidden focusable="false">
      <path
        fill="#06C755"
        d="M19.5 4.5C17.2 2.8 14.2 2 11 2 5.5 2 1 5.6 1 10.5c0 2.8 1.5 5.3 3.9 6.9-.2.7-.7 2.5-.8 2.9-.1.4.1.8.5.9.3.1.6 0 .8-.2.3-.2 2.8-1.9 3.9-2.7.7.1 1.4.2 2.1.2 5.5 0 10-3.6 10-8.5S24.8 6.2 19.5 4.5z"
      />
    </svg>
  );
}

export default function ShareButton({
  shareUrl,
  lineUrl,
  storySlug,
  leading,
  className,
}: ShareButtonProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      if (storySlug) trackShareClick(storySlug, "copy_link");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }

  return (
    <div
      className={[styles.row, className].filter(Boolean).join(" ")}
      role="group"
      aria-label={leading ? "故事操作" : "分享這集"}
    >
      {leading}
      <button
        type="button"
        className={styles.btn}
        onClick={copyLink}
        aria-live="polite"
      >
        <span className={styles.icon}>
          <LinkIcon />
        </span>
        <span>
          {copyState === "copied"
            ? "已複製連結"
            : copyState === "failed"
              ? "請長按複製"
              : "複製連結"}
        </span>
      </button>
      <a
        href={lineUrl}
        className={`${styles.btn} ${styles.line}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="以 LINE 分享"
        title="以 LINE 分享"
        onClick={() => {
          if (storySlug) trackShareClick(storySlug, "line");
        }}
      >
        <span className={styles.icon}>
          <LineIcon />
        </span>
        <span>LINE 分享</span>
      </a>
    </div>
  );
}
