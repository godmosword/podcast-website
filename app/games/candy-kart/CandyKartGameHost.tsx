"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { candyKartAdapter } from "@/lib/gamekit/games/candy-kart/adapter";
import { GAMES } from "@/data/games";
import styles from "./page.module.css";

const CANDY_KART_META = GAMES.find((g) => g.slug === "candy-kart");

export default function CandyKartGameHost() {
  return (
    <GameHost
      adapter={candyKartAdapter}
      title="繽紛卡丁車"
      tutorial={CANDY_KART_META?.tutorial ?? []}
    >
      <p className={styles.kartNote}>畫面沒出來嗎？重新整理一下試試 🍬</p>
    </GameHost>
  );
}
