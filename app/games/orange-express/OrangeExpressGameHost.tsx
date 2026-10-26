"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { orangeExpressAdapter } from "@/lib/gamekit/games/orange-express/adapter";
import { GAMES } from "@/data/games";

const META = GAMES.find((game) => game.slug === "orange-express");

export default function OrangeExpressGameHost() {
  return (
    <GameHost
      adapter={orangeExpressAdapter}
      title="小橘特快車"
      tutorial={META?.tutorial ?? []}
    />
  );
}
