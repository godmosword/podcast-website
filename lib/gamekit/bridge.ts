import type { CanvasPalette } from "@/lib/games/canvas-palette";
import { colorsForGame, MASTER_PALETTE } from "./palette";
import type { GameKitGameId } from "./types";

/** 從 Game Kit 子調色盤建立 canvas 遊戲用色（Phase 1）。 */
export function canvasPaletteFromKit(gameId: GameKitGameId): CanvasPalette {
  const c = colorsForGame(gameId);
  return {
    road: c[0] ?? MASTER_PALETTE[19],
    roadMark: "rgba(255,255,255,0.25)",
    truck: c[1] ?? MASTER_PALETTE[9],
    wheel: MASTER_PALETTE[18],
    firefly: c[2] ?? MASTER_PALETTE[7],
    fireflyGlow: "rgba(255,255,255,0.2)",
    gentleHint: c[3] ?? MASTER_PALETTE[14],
  };
}

/** 橫向過關天空／地面色。 */
export function adventureKitColors() {
  const c = colorsForGame("car-adventure");
  return {
    sky: c[3] ?? MASTER_PALETTE[17],
    ground: c[1] ?? MASTER_PALETTE[25],
    player: c[2] ?? MASTER_PALETTE[7],
    hudBg: "rgba(0,0,0,0.35)",
    hudText: MASTER_PALETTE[23],
  };
}

/** 方塊遊戲井與方塊色。 */
export function blockDropKitColors(): Record<string, string> {
  const c = colorsForGame("block-drop");
  return {
    well: c[0] ?? "#0a0d14",
    wellBorder: c[1] ?? "#222a3d",
    I: c[2] ?? "#5bc0eb",
    O: c[3] ?? "#ffd166",
    T: c[4] ?? "#c084fc",
    S: c[5] ?? "#6bcb77",
    Z: c[6] ?? "#ff6b6b",
    J: c[2] ?? "#4d96ff",
    L: c[3] ?? "#f4a261",
  };
}
