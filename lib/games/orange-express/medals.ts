import type { RunState } from "@/lib/games/orange-express/types";

export type RunMedals = {
  cleared: boolean;
  flawless: boolean;
  collectedAll: boolean;
  stars: number;
};

/**
 * 開完每一站才算過關。
 * 沒衝過站、也沒在還在跑的時候按開門，才是停得很漂亮。
 * 喇叭不算。開完這一條，朋友都接到了。
 */
export function medalsFor(state: RunState, earlyDoorTaps: number): RunMedals {
  const cleared = state.phase === "route-done";
  const flawless = cleared && state.misses === 0 && earlyDoorTaps === 0;
  const collectedAll = cleared;
  const stars = (cleared ? 1 : 0) + (flawless ? 1 : 0) + (collectedAll ? 1 : 0);
  return { cleared, flawless, collectedAll, stars };
}
