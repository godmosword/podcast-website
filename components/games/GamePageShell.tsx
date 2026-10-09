import type { ReactNode } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { GameLoadingGate } from "@/components/games/GameLoadingGate";
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
 * 操作提示圖示。key 對齊 `data/games.ts` 的 `controls` 文案；沒對到 icon 的文案只顯示文字。
 * K-9（兒童減法審）曾改成「以圖代字」、文案只留 sr-only，2026-10-06 改回「圖示＋可見文字」：
 * 只有圖示時說明藏在 title，觸控裝置看不到，家長回報看不懂那兩顆是做什麼的。
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
 * 順序是「遊戲 → 兒童操作提示」。遊戲區吃掉抬頭以下的視窗，不再接家長說明。
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
   * 操作提示屬兒童資訊，留在遊戲正下方。
   * 全部顯示，不做靜默截斷——截斷會讓新增的第三條提示無聲消失。
   * 遊戲畫面還沒有可操作的棋盤時（標題頁、地圖），遊戲在自身根節點標
   * `data-play-hints="off"`，由 CSS 收起提示。消消樂一律收起：第 1 站棋盤上有手指示範。
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
                <li key={control}>
                  {/* 圖示一律搭配可見文字：只放圖示時說明只在滑鼠停留出現，觸控裝置看不到 */}
                  {icon ? <span aria-hidden className={styles.playHintIcon}>{icon}</span> : null}
                  {control}
                </li>
              );
            })}
          </ul>
        ) : null}

        <GameSessionTracker gameId={gameId} />
      </main>
    </GamePlayChromeProvider>
  );
}
