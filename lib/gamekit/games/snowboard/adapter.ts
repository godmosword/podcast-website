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
  SnowboardView,
  type SnowboardController,
} from "@/components/games/SnowboardView";
import type { SnowboardConfigMessage } from "../snowboard-bridge";

export const SNOWBOARD_STATUS_MAP = {
  idle: "ready",
  loading: "ready",
  loaded: "ready",
  finishedWin: "won",
} as const satisfies Record<string, GameStatus>;

export class SnowboardInstance implements GameInstance {
  readonly id = "snowboard" as const;
  private status: GameStatus = "ready";
  private score = 0;
  private levelIndex = 0;
  private controller: SnowboardController | null = null;

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

  pause(): void {
    this.controller?.sendControl("pause");
    this.status = "paused";
  }

  resume(): void {
    this.controller?.sendControl("resume");
    this.status = "ready";
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

  registerController(controller: SnowboardController): void {
    this.controller = controller;
  }

  configure(message: SnowboardConfigMessage): void {
    this.controller?.sendConfig(message);
  }

  notifyReady(): void {
    this.status = "ready";
  }

  notifyLoaded(): void {
    this.status = "ready";
  }

  notifyFinish(session: GameSessionResult): void {
    this.score = session.score;
    if (session.levelIndex !== undefined) this.levelIndex = session.levelIndex;
    this.status = session.cleared ? "won" : "over";
    this.options.onSession?.(session);
  }

  renderOverlay(props: OverlayProps) {
    return createElement(SnowboardView, { ...props, instance: this });
  }
}

export const snowboardAdapter: GameAdapter = {
  id: "snowboard",
  create(options: GameCreateOptions): GameInstance {
    return new SnowboardInstance(options);
  },
};
