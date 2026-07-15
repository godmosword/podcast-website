"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./ColoringPageShell.module.css";

type ColoringPageShellProps = {
  children: ReactNode;
  title?: string;
};

/** 著色本頁輕量外框（不掛 GameKit）。 */
export function ColoringPageShell({
  children,
  title = "繪本著色",
}: ColoringPageShellProps) {
  return (
    <main className={styles.main} aria-label={title}>
      <a href="#coloring-play" className={styles.skip}>
        跳到著色區域
      </a>
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <h1 className={styles.title}>{title}</h1>
      <div id="coloring-play">{children}</div>
    </main>
  );
}
