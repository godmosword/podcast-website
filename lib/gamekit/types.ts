import type { GameScoreId } from "@/lib/progress-store";

/** Game Kit 內的識別字（對齊 `lib/games/catalog.ts` id）。 */
export type GameKitGameId =
  | "block-drop"
  | "car-adventure"
  | "candy-kart"
  | "candy-match"
  | "snowboard";

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
  /** 車車大冒險各關最佳顯示星數；不參與 GameKit medal/economy。 */
  adventureStars?: Record<number, number>;
  /** Snowboard 已解鎖賽道；舊存檔預設只開放第一條。 */
  snowboardCoursesUnlocked?: string[];
  stickers: string[];
  gamesPlayed: Partial<Record<GameScoreId, boolean>>;
};
