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
import {
  BlockDropView,
  type BlockDropController,
} from "@/components/games/BlockDropView";

/** 局內 Status → GameStatus（無 won；堆到頂即 over）。 */
export const BLOCK_DROP_STATUS_MAP = {
  ready: "ready",
  playing: "playing",
  paused: "paused",
  over: "over",
} as const satisfies Record<string, GameStatus>;

class BlockDropInstance implements GameInstance {
  readonly id = "block-drop" as const;

  private status: GameStatus = "ready";
  private score = 0;
  private sessionReported = false;
  private controller: BlockDropController | null = null;

  constructor(private readonly options: GameCreateOptions) {}

  getStatus(): GameStatus {
    return this.status;
  }

  getScore(): number {
    return this.score;
  }

  start(): void {
    this.sessionReported = false;
    this.controller?.begin();
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.controller?.pause();
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.controller?.resume();
  }

  restart(): void {
    this.sessionReported = false;
    this.controller?.begin();
  }

  dispose(): void {
    this.controller = null;
  }

  setAction(action: GameAction, pressed: boolean): void {
    if (!pressed || action !== "confirm") return;
    if (this.status === "ready" || this.status === "over") {
      this.start();
    }
  }

  getTouchActions(): readonly GameAction[] {
    // 觸控板由 View 自管（含 hold／硬降手勢）。
    return [];
  }

  registerController(ctrl: BlockDropController): void {
    this.controller = ctrl;
  }

  notifyPlaying(score: number): void {
    this.status = "playing";
    this.score = score;
  }

  notifyPaused(): void {
    this.status = "paused";
  }

  notifyOver(score: number): void {
    this.status = "over";
    this.score = score;
    if (!this.sessionReported) {
      this.sessionReported = true;
      this.options.onSession?.({
        gameId: "block-drop",
        score,
      });
    }
  }

  notifyReady(): void {
    this.status = "ready";
    this.score = 0;
  }

  renderOverlay(props: OverlayProps) {
    return createElement(BlockDropView, {
      ...props,
      audio: this.options.audio,
      instance: this,
    });
  }
}

export const blockDropAdapter: GameAdapter = {
  id: "block-drop",
  create(options: GameCreateOptions): GameInstance {
    return new BlockDropInstance(options);
  },
};

export { BlockDropInstance };
