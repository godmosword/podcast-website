/**
 * GameKit Adapter contract
 *
 * All four playground games (and future AI-generated ones) implement this
 * interface so a single GameHost can drive lifecycle, input, progress and UI.
 *
 * Design goals:
 * - Pure game logic stays inside the adapter / instance
 * - Host owns React chrome, audio bus, visibility pause, session reporting
 * - Canvas games expose fixedUpdate + render; DOM / iframe games use overlay only
 * - Progress reporting stays on the existing reportGameSession path
 */

import type { ReactNode } from "react";
import type { GameKitGameId, GameAction } from "./types";
import type { GameSessionResult } from "./progress/session";

export type GameStatus = "ready" | "playing" | "paused" | "over" | "won";

export type GameCreateOptions = {
  kidsMode: boolean;
  reducedMotion: boolean;
  /** Optional difficulty / mode keys (game-specific). */
  difficulty?: string;
  specialMode?: string;
  /** Starting level / track index when applicable. */
  levelIndex?: number;
  /** Called once when a session ends (won / over). Host will also call reportGameSession. */
  onSession?: (result: GameSessionResult) => void;
};

export type OverlayProps = {
  status: GameStatus;
  score: number;
  best: number | null;
  kidsMode: boolean;
  reducedMotion: boolean;
  onStart: () => void;
  onResume: () => void;
  onRestart: () => void;
  onOpenTutorial: () => void;
};

/**
 * Runtime instance created by an adapter.
 * Owns all mutable game state. Host never mutates it directly.
 */
export interface GameInstance {
  readonly id: GameKitGameId;

  getStatus(): GameStatus;
  getScore(): number;
  /** Level / track index when the game has multiple stages. */
  getLevelIndex?(): number;

  start(levelIndex?: number): void;
  pause(): void;
  resume(): void;
  restart(levelIndex?: number): void;
  dispose(): void;

  /** Unified input. Host maps keyboard / touch / gamepad → GameAction. */
  setAction(action: GameAction, pressed: boolean): void;

  /**
   * Optional fixed-step update for canvas / physics games.
   * Called by Host at FIXED_DT when status === "playing".
   */
  fixedUpdate?(dt: number): void;

  /**
   * Optional canvas render. Host supplies a 2d context sized to the viewport.
   * alpha is the interpolation factor between fixed steps.
   */
  render?(ctx: CanvasRenderingContext2D, alpha: number): void;

  /**
   * Optional React overlay (menus, HUD, result screens, touch pads that are
   * game-specific). Host still owns the global GameChrome toolbar.
   */
  renderOverlay?(props: OverlayProps): ReactNode;

  /**
   * Optional list of actions this game needs touch buttons for.
   * Host can render a generic touch bar when coarse pointer is detected.
   */
  getTouchActions?(): readonly GameAction[];
}

export interface GameAdapter {
  readonly id: GameKitGameId;
  create(options: GameCreateOptions): GameInstance;
}

/** Registry helper – keeps discovery simple for routes / AI loaders. */
export type AdapterRegistry = Partial<Record<GameKitGameId, GameAdapter>>;
