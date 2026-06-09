/** 四款遊樂園遊戲在 Game Kit 內的識別字（對齊 `lib/games/catalog.ts` id）。 */
export type GameKitGameId =
  | "car-star"
  | "block-drop"
  | "car-adventure"
  | "car-mission";

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
  stars: number;
  unlockedVehicles: string[];
  bests: Partial<Record<GameKitGameId, number>>;
  medals: Partial<Record<GameKitGameId, number[]>>;
};
