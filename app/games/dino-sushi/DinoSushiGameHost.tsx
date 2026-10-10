"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { dinoSushiAdapter } from "@/lib/gamekit/games/dino-sushi/adapter";
import { GAMES } from "@/data/games";

const DINO_SUSHI_META = GAMES.find((g) => g.slug === "dino-sushi");

export default function DinoSushiGameHost() {
  return (
    <GameHost
      adapter={dinoSushiAdapter}
      title="多多壽司屋"
      tutorial={DINO_SUSHI_META?.tutorial ?? []}
    />
  );
}
