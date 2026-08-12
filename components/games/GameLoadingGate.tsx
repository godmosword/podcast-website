"use client";

import type { ReactNode } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { useGameAssetPreload } from "@/hooks/useGameAssetPreload";
import { GAMES } from "@/data/games";
import { GameLoadOverlay } from "@/components/games/GameLoadOverlay";
import styles from "./GameLoadingGate.module.css";

const LABELS: Record<GameKitGameId, string> = {
  "block-drop": "繽紛方塊",
  "candy-match": "繽紛消消樂",
};

type GameLoadingGateProps = {
  gameId: GameKitGameId;
  children: ReactNode;
  /** 按需預載程序生成的遊戲資產。 */
  manualStart?: boolean;
};

export function GameLoadingGate({
  gameId,
  children,
  manualStart = false,
}: GameLoadingGateProps) {
  const { ready, phase, start, retry } = useGameAssetPreload(gameId, {
    manualStart,
  });
  const title =
    LABELS[gameId] ??
    GAMES.find((game) => game.slug === gameId)?.title ??
    "小遊戲";
  const game = GAMES.find((item) => item.slug === gameId);

  if (!ready) {
    return (
      <div className={styles.wrap}>
        <GameLoadOverlay
          phase={phase}
          title={
            phase === "idle"
              ? `準備 ${title}`
              : `正在載入${title}…`
          }
          hint={
            phase === "idle"
              ? "點下方按鈕開始載入遊戲資源與音效"
              : "載入遊戲資源與音效，請稍候"
          }
          onStart={manualStart ? start : undefined}
          onRetry={retry}
          staticLayout
          artSrc={game?.art.cover}
          artAlt={game?.art.alt}
        />
      </div>
    );
  }

  return <>{children}</>;
}
