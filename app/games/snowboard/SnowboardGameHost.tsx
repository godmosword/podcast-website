"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { snowboardAdapter } from "@/lib/gamekit/games/snowboard/adapter";
import { GAMES } from "@/data/games";
import styles from "./page.module.css";

const SNOWBOARD_META = GAMES.find((game) => game.slug === "snowboard");

export default function SnowboardGameHost() {
  return (
    <GameHost
      adapter={snowboardAdapter}
      title="阿蹦雪山衝刺"
      tutorial={SNOWBOARD_META?.tutorial ?? []}
    >
      <p className={styles.snowNote}>畫面沒出來嗎？重新整理一下再試試 🏂</p>
    </GameHost>
  );
}
