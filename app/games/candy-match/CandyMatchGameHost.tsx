"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { candyMatchAdapter } from "@/lib/gamekit/games/candy-match/adapter";
import { GAMES } from "@/data/games";

const CANDY_MATCH_META = GAMES.find((g) => g.slug === "candy-match");

export default function CandyMatchGameHost() {
  return (
    <GameHost
      adapter={candyMatchAdapter}
      title="繽紛消消樂"
      tutorial={CANDY_MATCH_META?.tutorial ?? []}
    />
  );
}
