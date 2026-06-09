/** Game Kit 內的識別字（對齊 `lib/games/catalog.ts` id）。 */
export type GameKitGameId = "block-drop" | "car-adventure";

export type ViewportSize = {
  width: number;
  height: number;
};

/** 統一輸入 action（鍵盤／觸控／手把映射到此）。 */
export type GameAction =
  | "move-left"
  | "move-right"
  | "move-up"
  | "move-down"
  | "action"
  | "pause"
  | "confirm"
  | "cancel";

export type GameSceneId = "title" | "menu" | "play" | "pause" | "result";

export type PlayerProfile = {
  version: number;
  /** 車庫解鎖用累積星星 */
  stars: number;
  unlockedVehicles: string[];
  bests: Partial<Record<GameKitGameId, number>>;
  /** 每款遊戲各關／迷宮的三星 bit flags */
  medals: Partial<Record<GameKitGameId, number[]>>;
  stickers: string[];
  gamesPlayed: Partial<Record<GameKitGameId, boolean>>;
};
