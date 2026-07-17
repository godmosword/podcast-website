"use client";

import { useEffect } from "react";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { trackGameSessionStart } from "@/lib/analytics";

export default function GameSessionTracker({ gameId }: { gameId: GameKitGameId }) {
  useEffect(() => {
    trackGameSessionStart(gameId);
  }, [gameId]);

  return null;
}
