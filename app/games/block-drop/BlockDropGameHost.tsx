"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { blockDropAdapter } from "@/lib/gamekit/games/block-drop/adapter";
import { GAMES } from "@/data/games";

const BLOCK_DROP_META = GAMES.find((g) => g.slug === "block-drop");

export default function BlockDropGameHost() {
  return (
    <GameHost
      adapter={blockDropAdapter}
      title="繽紛樂園"
      tutorial={BLOCK_DROP_META?.tutorial ?? []}
    />
  );
}
