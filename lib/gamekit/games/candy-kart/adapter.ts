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
import {
  CandyKartView,
  type CandyKartController,
} from "@/components/games/CandyKartView";

/**
 * 載入／賽事階段 → GameStatus。
 * 無 race-start postMessage：載入後維持 ready（避免 Host chiptune 蓋過 Godot BGM）。
 */
export const CANDY_KART_STATUS_MAP = {
  idle: "ready",
  loading: "ready",
  loaded: "ready",
  finishedWin: "won",
  finishedLose: "over",
  paused: "paused",
} as const satisfies Record<string, GameStatus>;

class CandyKartInstance implements GameInstance {
  readonly id = "candy-kart" as const;

  private status: GameStatus = "ready";
  private score = 0;
  private levelIndex = 0;
  private controller: CandyKartController | null = null;

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

  start(): void {
    this.controller?.startLoad();
  }

  /** Godot 內建暫停；父頁無 pause postMessage（Phase 4 no-op）。 */
  pause(): void {
    if (this.status !== "playing") return;
    this.status = "paused";
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.status = "playing";
  }

  restart(): void {
    this.status = "ready";
    this.score = 0;
    this.controller?.retry();
  }

  dispose(): void {
    this.controller = null;
  }

  setAction(action: GameAction, pressed: boolean): void {
    if (!pressed || action !== "confirm") return;
    if (this.status === "ready" || this.status === "over" || this.status === "won") {
      this.start();
    }
  }

  getTouchActions(): readonly GameAction[] {
    return [];
  }

  registerController(ctrl: CandyKartController): void {
    this.controller = ctrl;
  }

  notifyReady(): void {
    this.status = "ready";
  }

  notifyLoaded(): void {
    this.status = "ready";
  }

  notifyFinish(session: GameSessionResult): void {
    this.score = session.score;
    if (session.levelIndex !== undefined) {
      this.levelIndex = session.levelIndex;
    }
    this.status = session.cleared ? "won" : "over";
    this.options.onSession?.(session);
  }

  renderOverlay(props: OverlayProps) {
    return createElement(CandyKartView, {
      ...props,
      instance: this,
    });
  }
}

export const candyKartAdapter: GameAdapter = {
  id: "candy-kart",
  create(options: GameCreateOptions): GameInstance {
    return new CandyKartInstance(options);
  },
};

export { CandyKartInstance };
