import type { GameScoreId } from "@/lib/progress-store";

/**
 * Game Kit 遊戲 id 的唯一來源。新增遊戲時 TS 會強制補齊各 Record（載入標題、預載、BGM）；
 * 其餘手寫名單（活動紀錄、家長儀表板、貼紙）由單元測試對照這個陣列。
 */
export const GAMEKIT_GAME_IDS = ["block-drop", "candy-match", "dino-sushi"] as const;

/** Game Kit 內的識別字（對齊 `data/games.ts` slug；同時是存檔與 analytics 的 key）。 */
export type GameKitGameId = (typeof GAMEKIT_GAME_IDS)[number];

/** 統一輸入 action（鍵盤／觸控／手把映射到此）。 */
export type GameAction =
  | "move-left"
  | "move-right"
  | "move-up"
  | "move-down"
  | "dash"
  | "action"
  | "pause"
  | "confirm"
  | "cancel";

export type StarLedgerEntry = {
  id: string;
  amount: number;
  source: string;
  at: string;
};

export type Economy = {
  lifetimeStars: number;
  balance: number;
  ledger: StarLedgerEntry[];
};

export type PlayerProfile = {
  version: number;
  /** 車庫解鎖用累積星星（與 economy.lifetimeStars 同步） */
  stars: number;
  economy?: Economy;
  unlockedVehicles: string[];
  bests: Partial<Record<GameScoreId, number>>;
  /** 每款遊戲各關／迷宮的三星 bit flags */
  medals: Partial<Record<GameKitGameId, number[]>>;
  stickers: string[];
  gamesPlayed: Partial<Record<GameScoreId, boolean>>;
};
