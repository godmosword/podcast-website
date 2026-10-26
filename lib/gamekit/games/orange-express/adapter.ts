"use client";

import { createElement } from "react";
import type {
  GameAdapter,
  GameCreateOptions,
  GameInstance,
  GameStatus,
  OverlayProps,
} from "@/lib/gamekit/adapter";
import { OrangeExpressView } from "@/components/games/OrangeExpressView";
import { medalsFor } from "@/lib/games/orange-express/medals";
import { LEVEL_INDEX, type LevelId, type RunState } from "@/lib/games/orange-express/types";
import type { GameAction } from "@/lib/gamekit/types";

type Screen = "title" | "drive" | "result";

export type OrangeExpressController = {
  startSelected(): void;
  restart(): void;
  goToTitle(): void;
  onAction(action: GameAction): void;
};

const TITLE_ENTER_GRACE_MS = 300;

function focusOnControl(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.activeElement;
  return el != null && el !== document.body && el.closest("button, a") !== null;
}

const NOOP: OrangeExpressController = {
  startSelected: () => {},
  restart: () => {},
  goToTitle: () => {},
  onAction: () => {},
};

/**
 * 前窗是遊戲自己的畫布，不走 GameHost 的像素迴圈。
 * 沒有 fixedUpdate／render，Host 就不會再掛一張畫布。
 */
class OrangeExpressInstance implements GameInstance {
  readonly id = "orange-express" as const;

  private status: GameStatus = "ready";
  private screen: Screen = "title";
  private level: LevelId = "look";
  private paused = false;
  private sessionReported = false;
  private readyAt = 0;
  private resultAt = 0;
  private earlyDoorTaps = 0;
  private held = new Set<GameAction>();
  private controller: OrangeExpressController = NOOP;

  constructor(private readonly options: GameCreateOptions) {}

  getStatus(): GameStatus {
    return this.status;
  }

  getScore(): number {
    return 0;
  }

  getLevelIndex(): number {
    return LEVEL_INDEX[this.level];
  }

  showsScore(): boolean {
    return false;
  }

  start(): void {
    if (this.status === "playing" || this.status === "paused") return;
    if (this.screen === "title") {
      if (Date.now() - this.readyAt < TITLE_ENTER_GRACE_MS) return;
      this.controller.startSelected();
      return;
    }
    if (Date.now() - this.resultAt < TITLE_ENTER_GRACE_MS) return;
    if (focusOnControl()) return;
    this.controller.restart();
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

  restart(): void {
    if (this.screen === "title") {
      this.controller.goToTitle();
      return;
    }
    this.controller.restart();
  }

  dispose(): void {
    this.controller = NOOP;
  }

  setAction(action: GameAction, held: boolean): void {
    const was = this.held.has(action);
    if (held) this.held.add(action);
    else this.held.delete(action);
    if (!held || was || this.status !== "playing") return;
    this.controller.onAction(action);
  }

  /**
   * 鍵盤按下當下就送動作。Host 每幀只看「還按著嗎」，按下又放開落在同一幀之間（快點一下、
   * 低階手機一幀很長）就整個漏掉。這裡先記成按著，Host 下一幀看到同一顆鍵不會再送一次，
   * 看到已放開時照常清掉。
   */
  pressKey(action: GameAction): void {
    if (this.held.has(action)) return;
    this.held.add(action);
    if (this.status !== "playing") return;
    this.controller.onAction(action);
  }

  /** 放開就清掉，同一幀內連按兩下才會算兩下。 */
  releaseKey(action: GameAction): void {
    this.held.delete(action);
  }

  registerController(ctrl: OrangeExpressController): void {
    this.controller = ctrl;
  }

  notifyReady(): void {
    this.readyAt = Date.now();
    this.screen = "title";
    this.paused = false;
    this.status = "ready";
  }

  notifyPlaying(level: LevelId): void {
    this.level = level;
    this.screen = "drive";
    this.paused = false;
    this.sessionReported = false;
    this.earlyDoorTaps = 0;
    this.held.clear();
    this.status = "playing";
  }

  noteEarlyDoor(): void {
    this.earlyDoorTaps += 1;
  }

  earlyDoorCount(): number {
    return this.earlyDoorTaps;
  }

  notifyWon(run: RunState): void {
    this.screen = "result";
    this.status = "won";
    this.resultAt = Date.now();
    if (this.sessionReported) return;
    this.sessionReported = true;
    const medals = medalsFor(run, this.earlyDoorTaps);
    this.options.onSession?.({
      gameId: this.id,
      score: 0,
      levelIndex: LEVEL_INDEX[run.level],
      orangeExpressLevel: run.level,
      cleared: medals.cleared,
      flawless: medals.flawless,
      collectedAll: medals.collectedAll,
    });
  }

  isInputPaused(): boolean {
    return this.paused || this.status === "paused";
  }

  renderOverlay(props: OverlayProps) {
    return createElement(OrangeExpressView, {
      ...props,
      audio: this.options.audio,
      instance: this,
    });
  }
}

export const orangeExpressAdapter: GameAdapter = {
  id: "orange-express",
  create(options: GameCreateOptions): GameInstance {
    return new OrangeExpressInstance(options);
  },
};

export { OrangeExpressInstance };
