/** 遊戲資源載入階段（preload → loading → ready / error）。 */
export type GameLoadPhase =
  | "idle"
  | "loading"
  | "ready"
  | "timeout";

export const DEFAULT_GAME_LOAD_TIMEOUT_MS = 30_000;
