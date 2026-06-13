"use client";

import type { ReactNode } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { useGameAssetPreload } from "@/hooks/useGameAssetPreload";
import { GAMES } from "@/lib/games/catalog";
import styles from "./GameLoadingGate.module.css";

const LABELS: Record<GameKitGameId, string> = {
  "car-adventure": "車車大冒險",
  "block-drop": "繽紛方塊",
  "candy-kart": "繽紛卡丁車",
  "candy-match": "繽紛消消樂",
};

type GameLoadingGateProps = {
  gameId: GameKitGameId;
  children: ReactNode;
};

export function GameLoadingGate({ gameId, children }: GameLoadingGateProps) {
  const { ready } = useGameAssetPreload(gameId);
  const title = LABELS[gameId] ?? GAMES.find((g) => g.id === gameId)?.title ?? "小遊戲";

  if (!ready) {
    return (
      <div
        className={styles.wrap}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={`正在載入${title}`}
      >
        <div className={styles.spinner} aria-hidden />
        <p className={styles.text}>正在準備 {title}…</p>
        <p className={styles.hint}>載入像素圖與音效，請稍候</p>
      </div>
    );
  }

  return <>{children}</>;
}
