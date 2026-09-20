import type { ReactNode } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { GameLoadingGate } from "@/components/games/GameLoadingGate";
import { GameIntro } from "@/components/games/GameIntro";
import GameSessionTracker from "@/components/games/GameSessionTracker";
import {
  GamePlayChromeProvider,
  GamePlayHeader,
} from "@/components/games/GamePlayChromeSlot";
import { GAMES } from "@/data/games";
import {
  IconChevronLeft,
  IconChevronRight,
  IconRotate,
  IconSwipe,
  IconSwipeDown,
  IconTap,
} from "@/components/games/ClayIcons";
import styles from "./GamePageShell.module.css";

/**
 * K-9（兒童減法審）：操作提示以圖代字。key 對齊 `data/games.ts` 的 `controls` 文案，
 * 文案本身留作 sr-only；沒對到 icon 的文案退回顯示文字，不會消失。
 */
const CONTROL_ICONS: Record<string, ReactNode> = {
  點兩格交換: <IconTap size={22} />,
  拖曳也可以: <IconSwipe size={22} />,
  左右移動: (
    <>
      <IconChevronLeft size={22} />
      <IconChevronRight size={22} />
    </>
  ),
  旋轉與落下: (
    <>
      <IconRotate size={22} />
      <IconSwipeDown size={22} />
    </>
  ),
};

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
 * 頁面唯一 `<h1>` 由 `.playHeader` 持有，id 為 `game-play-title`。
 * 工具列經 GamePlayChromeSlot portal 進同一 sticky 列（PLAY-IA-7）；
 * ThemeToggle 掛在抬頭右側（PLAY-IA-8）。
 */
export function GamePageShell({
  children,
  title,
  gameId,
  preload = true,
}: GamePageShellProps) {
  const game = GAMES.find((item) => item.slug === gameId);
  const playTitle = game?.title ?? title;
  /**
   * 操作提示屬兒童資訊，須留在遊戲旁；家長資訊才下移到 GameIntro。
   * 全部顯示，不做靜默截斷——截斷會讓新增的第三條提示無聲消失。
   */
  const controls = game?.controls ?? [];

  return (
    <GamePlayChromeProvider>
      <main className={styles.main} aria-label={title} data-game-id={gameId}>
        <a href="#game-play" className={styles.skip}>
          跳到遊戲區域
        </a>

        <GamePlayHeader playTitle={playTitle} />

        <div id="game-play" className={styles.playArea}>
          {preload ? (
            <GameLoadingGate gameId={gameId}>{children}</GameLoadingGate>
          ) : (
            children
          )}
        </div>

        {controls.length > 0 ? (
          <ul className={styles.playHints} aria-label="操作提示">
            {controls.map((control) => {
              const icon = CONTROL_ICONS[control];
              return (
                <li key={control} title={icon ? control : undefined}>
                  {icon ? (
                    <>
                      <span aria-hidden className={styles.playHintIcon}>{icon}</span>
                      <span className="sr-only">{control}</span>
                    </>
                  ) : (
                    control
                  )}
                </li>
              );
            })}
          </ul>
        ) : null}

        <GameIntro gameId={gameId} />
        <GameSessionTracker gameId={gameId} />
      </main>
    </GamePlayChromeProvider>
  );
}
