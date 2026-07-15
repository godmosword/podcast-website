"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./ColoringPageShell.module.css";

type ColoringPageShellProps = {
  children: ReactNode;
  title?: string;
  /** 封面態由 ColoringCover 承擔 h1，避免雙標題。 */
  showTitle?: boolean;
};

/** 著色本頁輕量外框（不掛 GameKit）。 */
export function ColoringPageShell({
  children,
  title = "繪本著色",
  showTitle = true,
}: ColoringPageShellProps) {
  return (
    <main className={styles.main} aria-label={title}>
      <a href="#coloring-play" className={styles.skip}>
        跳到著色區域
      </a>
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      {showTitle ? <h1 className={styles.title}>{title}</h1> : null}
      <div id="coloring-play">{children}</div>
    </main>
  );
}
