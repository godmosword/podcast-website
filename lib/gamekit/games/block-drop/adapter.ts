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
  BlockDropView,
  type BlockDropController,
} from "@/components/games/BlockDropView";

/** 局內 Status → GameStatus（任務冒險過關＝won；到頂、塊數用完、收尾＝over）。 */
export const BLOCK_DROP_STATUS_MAP = {
  ready: "ready",
  playing: "playing",
  paused: "paused",
  over: "over",
  won: "won",
} as const satisfies Record<string, GameStatus>;

class BlockDropInstance implements GameInstance {
  readonly id = "block-drop" as const;

  private status: GameStatus = "ready";
  private score = 0;
  private sessionReported = false;
  private adventure = false;
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


  registerController(ctrl: BlockDropController): void {
    this.controller = ctrl;
  }

  /**
   * 每次開新局（含 View 內「下一站／再挑戰」）都重置結算去重，同一局只回報一次。
   * 暫停後繼續、救援後繼續也會呼叫，傳 `newRound: false` 不重置。
   */
  notifyPlaying(score: number, options: { newRound?: boolean; adventure?: boolean } = {}): void {
    if (options.newRound) {
      this.sessionReported = false;
      this.adventure = Boolean(options.adventure);
    }
    this.status = "playing";
    this.score = score;
  }

  /** 任務冒險過關：回報獎章（分數固定 0，不影響自由堆疊最佳分）。 */
  notifyWon(payload: Omit<GameSessionResult, "gameId" | "score">): void {
    this.status = "won";
    this.score = 0;
    if (!this.sessionReported) {
      this.sessionReported = true;
      this.options.onSession?.({ gameId: "block-drop", score: 0, ...payload });
    }
  }

  /** 任務冒險沒過（塊數用完、到頂、收尾）：不回報 session。 */
  notifyRoundEnded(): void {
    this.status = "over";
    this.score = 0;
  }

  /** 抬頭的「最佳 ⭐」只在自由堆疊顯示。 */
  showsScore(): boolean {
    return !this.adventure;
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
