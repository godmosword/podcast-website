"use client";

import GameHost from "@/lib/gamekit/host/GameHost";
import { carAdventureAdapter } from "@/lib/gamekit/games/car-adventure/adapter";
import { viewportFor } from "@/lib/gamekit/runtime/constants";
import { GAMES } from "@/data/games";

const CAR_ADVENTURE_META = GAMES.find((g) => g.slug === "car-adventure");
const VP = viewportFor("car-adventure");

export default function CarAdventureGameHost() {
  return (
    <GameHost
      adapter={carAdventureAdapter}
      title="🏁 車車大冒險"
      tutorial={CAR_ADVENTURE_META?.tutorial ?? []}
      canvasWidth={VP.width}
      canvasHeight={VP.height}
    />
  );
}
