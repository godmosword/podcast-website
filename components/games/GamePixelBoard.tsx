"use client";

import type { CSSProperties, ReactNode } from "react";
import type { GameKitGameId } from "@/lib/gamekit";
import { colorsForGame } from "@/lib/gamekit/palette";
import { usePixelBoardScale } from "@/hooks/usePixelBoardScale";
import styles from "./GamePixelBoard.module.css";

export type GamePixelBoardProps = {
  gameId: GameKitGameId;
  nativeWidth: number;
  nativeHeight: number;
  className?: string;
  children: ReactNode;
};

/**
 * DOM 型遊戲（迷宮、方塊）的像素整數倍放大外殼。
 */
export default function GamePixelBoard({
  gameId,
  nativeWidth,
  nativeHeight,
  className,
  children,
}: GamePixelBoardProps) {
  const { containerRef, layout, viewport } = usePixelBoardScale(
    gameId,
    nativeWidth,
    nativeHeight,
  );

  const shellStyle = {
    "--pixel-game-aspect": `${viewport.width} / ${viewport.height}`,
    "--pixel-board-bg": colorsForGame(gameId)[0],
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`${styles.shell}${className ? ` ${className}` : ""}`}
      style={shellStyle}
    >
      <div
        className={styles.stage}
        style={{
          width: layout.displayWidth,
          height: layout.displayHeight,
        }}
      >
        <div
          className={styles.native}
          style={{
            width: nativeWidth,
            height: nativeHeight,
            transform: `scale(${layout.scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
