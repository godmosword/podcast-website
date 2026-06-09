import type { ReactNode } from "react";
import Link from "next/link";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { GameLoadingGate } from "@/components/games/GameLoadingGate";
import styles from "./GamePageShell.module.css";

type GamePageShellProps = {
  children: ReactNode;
  title: string;
  gameId: GameKitGameId;
};

/** 各款遊戲頁共用外框：跳過連結、a11y 標題、資產預載、回遊樂園。 */
export function GamePageShell({ children, title, gameId }: GamePageShellProps) {
  return (
    <main className={styles.main} aria-label={title}>
      <a href="#game-play" className={styles.skip}>
        跳到遊戲區域
      </a>
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>
      <div id="game-play">
        <GameLoadingGate gameId={gameId}>{children}</GameLoadingGate>
      </div>
    </main>
  );
}
