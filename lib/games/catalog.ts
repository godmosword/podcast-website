import { GAMES as GAME_DATA, type GameMeta } from "@/data/games";

/** @deprecated 使用 GameMeta；保留舊欄位 id 以相容既有元件。 */
export type GameCatalogEntry = GameMeta & { id: string };

export const GAMES: GameCatalogEntry[] = GAME_DATA.map((g) => ({
  ...g,
  id: g.slug,
}));
