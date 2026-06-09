import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./GamePageShell.module.css";

type GamePageShellProps = {
  children: ReactNode;
  title: string;
};

/** 各款遊戲頁共用外框：跳過連結、a11y 標題、回遊樂園。 */
export function GamePageShell({ children, title }: GamePageShellProps) {
  return (
    <main className={styles.main} aria-label={title}>
      <a href="#game-play" className={styles.skip}>
        跳到遊戲區域
      </a>
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <div id="game-play">{children}</div>
    </main>
  );
}
