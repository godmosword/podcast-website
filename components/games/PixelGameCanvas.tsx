"use client";

import type { CSSProperties, ReactNode } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { viewportFor } from "@/lib/gamekit/runtime/constants";
import { colorsForGame } from "@/lib/gamekit/runtime/palette";
import {
  PixelGameSurfaceContext,
  usePixelGameSurface,
  usePixelRenderer,
} from "@/hooks/usePixelRenderer";
import styles from "./PixelGameCanvas.module.css";

export type PixelGameCanvasProps = {
  gameId: GameKitGameId;
  className?: string;
  background?: string;
  maxScale?: number;
  children?: ReactNode;
};

function PixelGameCanvasFrame({
  gameId,
  className,
  children,
}: {
  gameId: GameKitGameId;
  className?: string;
  children?: ReactNode;
}) {
  const { containerRef, displayRef } = usePixelGameSurface();
  const vp = viewportFor(gameId);
  const frameStyle = {
    "--pixel-game-aspect": `${vp.width} / ${vp.height}`,
    "--pixel-game-bg": colorsForGame(gameId)[0],
  } as CSSProperties;

  return (
    <div
      ref={containerRef}
      className={`${styles.wrap}${className ? ` ${className}` : ""}`}
      style={frameStyle}
    >
      <canvas
        ref={displayRef}
        className={styles.canvas}
        role="img"
        aria-label="遊戲畫面"
      />
      {children}
    </div>
  );
}

function PixelGameCanvasProvider({
  gameId,
  background,
  maxScale,
  children,
}: {
  gameId: GameKitGameId;
  background?: string;
  maxScale?: number;
  children: ReactNode;
}) {
  const surface = usePixelRenderer(gameId, { background, maxScale });
  return (
    <PixelGameSurfaceContext.Provider value={surface}>
      {children}
    </PixelGameSurfaceContext.Provider>
  );
}

/**
 * Game Kit Phase 0/1：低解析度 buffer + 整數倍 pixelated 顯示。
 * 子元件用 `usePixelGameSurface()` 取得 ctx 與 `present()`。
 */
export default function PixelGameCanvas({
  gameId,
  className,
  background,
  maxScale,
  children,
}: PixelGameCanvasProps) {
  return (
    <PixelGameCanvasProvider
      gameId={gameId}
      background={background}
      maxScale={maxScale}
    >
      <PixelGameCanvasFrame gameId={gameId} className={className}>
        {children}
      </PixelGameCanvasFrame>
    </PixelGameCanvasProvider>
  );
}

export { usePixelGameSurface } from "@/hooks/usePixelRenderer";
