import type { ReactNode } from "react";
import Link from "next/link";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { GameLoadingGate } from "@/components/games/GameLoadingGate";
import { GameIntro } from "@/components/games/GameIntro";
import GameSessionTracker from "@/components/games/GameSessionTracker";
import { GAMES } from "@/data/games";
import styles from "./GamePageShell.module.css";

type GamePageShellProps = {
  children: ReactNode;
  title: string;
  gameId: GameKitGameId;
  preload?: boolean;
};

/**
 * 各款遊戲頁共用外框。
 *
 * 順序刻意是「遊戲 → 兒童操作提示 → 家長說明」：兒童主路徑優先，
 * `GameIntro` 的家長導向資訊退到第二層（見 docs/AGENT-WORKFLOW plan D1-A）。
 * 頁面唯一 `<h1>` 由本檔的 `.playHeader` 持有，id 為 `game-play-title`。
 */
export function GamePageShell({ children, title, gameId, preload = true }: GamePageShellProps) {
  const game = GAMES.find((item) => item.slug === gameId);
  const playTitle = game?.title ?? title;
  /**
   * 操作提示屬兒童資訊，須留在遊戲旁；家長資訊才下移到 GameIntro。
   * 全部顯示，不做靜默截斷——截斷會讓新增的第三條提示無聲消失。
   */
  const controls = game?.controls ?? [];

  return (
    <main className={styles.main} aria-label={title}>
      <a href="#game-play" className={styles.skip}>
        跳到遊戲區域
      </a>

      <header className={styles.playHeader}>
        <Link href="/games" className={styles.back}>
          <span aria-hidden>←</span> 回遊樂園
        </Link>
        <h1 id="game-play-title" className={styles.playTitle}>
          {playTitle}
        </h1>
      </header>

      <div id="game-play" className={styles.playArea}>
        {preload ? <GameLoadingGate gameId={gameId}>{children}</GameLoadingGate> : children}
      </div>

      {controls.length > 0 ? (
        <ul className={styles.playHints} aria-label="操作提示">
          {controls.map((control) => (
            <li key={control}>{control}</li>
          ))}
        </ul>
      ) : null}

      <GameIntro gameId={gameId} />
      <GameSessionTracker gameId={gameId} />
    </main>
  );
}
