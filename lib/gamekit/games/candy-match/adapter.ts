"use client";

import { createElement } from "react";
import type {
  GameAdapter,
  GameCreateOptions,
  GameInstance,
  GameStatus,
  OverlayProps,
} from "@/lib/gamekit/adapter";
import type { GameAction } from "@/lib/gamekit/types";
import type { GameSessionResult } from "@/lib/gamekit/progress/session";
import { CandyMatchView } from "@/components/games/CandyMatchView";
import type { CandyMatchController } from "@/components/games/CandyMatchView";

type Screen = "title" | "map" | "play";

/** 局內狀態 → GameStatus 對照（Host 生命週期用）。 */
export const CANDY_MATCH_STATUS_MAP = {
  title: "ready",
  map: "ready",
  play: "playing",
  win: "won",
  retry: "over",
  paused: "paused",
} as const satisfies Record<string, GameStatus>;

class CandyMatchInstance implements GameInstance {
  readonly id = "candy-match" as const;

  private status: GameStatus = "ready";
  private score = 0;
  private levelIndex = 0;
  private screen: Screen = "title";
  private paused = false;
  private sessionReported = false;
  private controller: CandyMatchController | null = null;

  constructor(private readonly options: GameCreateOptions) {}

  getStatus(): GameStatus {
    return this.status;
  }

  getScore(): number {
    return this.score;
  }

  getLevelIndex(): number {
    return this.levelIndex;
  }

  start(levelIndex?: number): void {
    this.sessionReported = false;
    this.paused = false;
    if (levelIndex !== undefined) {
      this.controller?.startLevel(levelIndex);
      return;
    }
    if (this.status === "over" || this.status === "won") {
      this.controller?.restartCurrentLevel();
      return;
    }
    if (this.screen === "title") {
      this.controller?.goToMap();
      return;
    }
    this.controller?.goToMap();
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.paused = true;
    this.status = "paused";
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.paused = false;
    this.status = "playing";
  }

  restart(levelIndex?: number): void {
    this.sessionReported = false;
    this.paused = false;
    const idx = levelIndex ?? this.levelIndex;
    if (this.screen === "play" || this.status === "won" || this.status === "over") {
      this.controller?.startLevel(idx);
      return;
    }
    this.controller?.goToTitle();
  }

  dispose(): void {
    this.controller = null;
  }

  setAction(action: GameAction, pressed: boolean): void {
    if (!pressed || action !== "confirm") return;
    if (this.status === "ready" && this.screen === "title") {
      this.controller?.goToMap();
    } else if (this.status === "over") {
      this.controller?.restartCurrentLevel();
    }
  }

  getTouchActions(): readonly GameAction[] {
    return [];
  }

  registerController(ctrl: CandyMatchController): void {
    this.controller = ctrl;
  }

  notifyReady(screen: "title" | "map"): void {
    this.screen = screen;
    this.paused = false;
    this.status = "ready";
  }

  notifyPlaying(levelIndex: number, score: number): void {
    this.screen = "play";
    this.levelIndex = levelIndex;
    this.score = score;
    this.paused = false;
    this.status = "playing";
  }

  notifyScore(score: number): void {
    this.score = score;
  }

  notifyWon(payload: Omit<GameSessionResult, "gameId">): void {
    this.status = "won";
    this.score = payload.score;
    if (!this.sessionReported) {
      this.sessionReported = true;
      this.options.onSession?.({ gameId: "candy-match", ...payload });
    }
  }

  notifyRetry(): void {
    this.status = "over";
  }

  isInputPaused(): boolean {
    return this.paused || this.status === "paused";
  }

  renderOverlay(props: OverlayProps) {
    return createElement(CandyMatchView, {
      ...props,
      audio: this.options.audio,
      instance: this,
    });
  }
}

export const candyMatchAdapter: GameAdapter = {
  id: "candy-match",
  create(options: GameCreateOptions): GameInstance {
    return new CandyMatchInstance(options);
  },
};

export { CandyMatchInstance };
