import type { GameKitGameId } from "../types";

/**
 * 車車故事屋 Game Kit 主調色盤（32 色）。
 * 各遊戲取子集；HUD／tile 共用同一光源方向（左上高光）。
 */
export const MASTER_PALETTE = [
  "#1a1a2e",
  "#16213e",
  "#0f3460",
  "#533483",
  "#e94560",
  "#ff6b6b",
  "#ff8e72",
  "#ffd166",
  "#ffe66d",
  "#f7a8c4",
  "#c084fc",
  "#a78bfa",
  "#7c3aed",
  "#6bcb77",
  "#b7df9b",
  "#4d96ff",
  "#5bc0eb",
  "#89cff0",
  "#34302b",
  "#5c534a",
  "#8d857b",
  "#c4b8a8",
  "#fff8f0",
  "#ffffff",
  "#2d6a4f",
  "#40916c",
  "#52b788",
  "#95d5b2",
  "#f4a261",
  "#e76f51",
  "#264653",
  "#2a9d8f",
] as const;

export type PaletteColor = (typeof MASTER_PALETTE)[number];

/** 各遊戲子調色盤索引（指向 MASTER_PALETTE）。 */
const GAME_PALETTE_INDICES: Record<GameKitGameId, number[]> = {
  "block-drop": [1, 6, 7, 9, 12, 15, 22, 23],
  "car-adventure": [0, 13, 14, 15, 24, 25, 26, 30],
  "candy-kart": [7, 8, 9, 11, 16, 17, 22, 27],
  "candy-match": [5, 7, 9, 11, 17, 22, 26, 27],
};

export function colorsForGame(gameId: GameKitGameId): PaletteColor[] {
  return GAME_PALETTE_INDICES[gameId].map((i) => MASTER_PALETTE[i]);
}

/** 相機／座標次像素取整，保持像素邊緣穩定。 */
export function snapPixel(value: number): number {
  return Math.round(value);
}
