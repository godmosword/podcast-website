"use client";

import type { ReactNode } from "react";
import {
  GamePlayChromeProvider,
  GamePlayHeader,
} from "@/components/games/GamePlayChromeSlot";
import shell from "@/components/games/GamePageShell.module.css";
import styles from "./ColoringPageShell.module.css";

type ColoringPageShellProps = {
  children: ReactNode;
  title?: string;
};

/**
 * 著色本頁外框（不掛 GameKit）。
 * G-M7：改用與 `GamePageShell` 同款的 sticky 抬頭（返回＋唯一 h1＋日夜切換），
 * 全站導覽由 `isImmersiveRoute` 隱藏；三層返回（nav／回遊樂園／回封面）收成一個出口。
 */
export function ColoringPageShell({
  children,
  title = "繪本著色",
}: ColoringPageShellProps) {
  return (
    <GamePlayChromeProvider>
      <main
        className={`${shell.main} ${styles.main}`}
        aria-label={title}
        data-game-id="coloring-book"
      >
        <a href="#coloring-play" className={shell.skip}>
          跳到著色區域
        </a>
        <GamePlayHeader playTitle={title} />
        <div id="coloring-play">{children}</div>
      </main>
    </GamePlayChromeProvider>
  );
}
