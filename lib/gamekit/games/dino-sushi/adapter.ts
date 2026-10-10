"use client";

import { createElement } from "react";
import type {
  GameAdapter,
  GameCreateOptions,
  GameInstance,
  GameStatus,
  OverlayProps,
} from "@/lib/gamekit/adapter";
import { DinoSushiView } from "@/components/games/DinoSushiView";
import { DINO_SUSHI_LEVEL_INDEX, type RoundMedals } from "@/lib/games/dino-sushi/medals";
import type { Mode } from "@/lib/games/dino-sushi/round";

type Screen = "title" | "kitchen" | "result";

export type DinoSushiController = {
  /** 「開始」＝多多點餐。 */
  startOrder(): void;
  startFree(): void;
  /** 同模式再來一輪。 */
  restart(): void;
  goToTitle(): void;
};

/** 回到標題後這段時間內的 start() 視為同一次按鍵的連帶觸發。 */
const TITLE_ENTER_GRACE_MS = 300;

const NOOP_CONTROLLER: DinoSushiController = {
  startOrder: () => {},
  startFree: () => {},
  restart: () => {},
  goToTitle: () => {},
};

/**
 * DOM 遊戲：沒有 fixedUpdate／render，不開 GameLoop，所以天生沒有計時。
 * 只透過 options.onSession 回報，由 GameHost 寫存檔（同 candy-match）。
 */
class DinoSushiInstance implements GameInstance {
  readonly id = "dino-sushi" as const;

  private status: GameStatus = "ready";
  private screen: Screen = "title";
  private mode: Mode = "order";
  private paused = false;
  private sessionReported = false;
  /** 剛回到標題的時間：結算畫面用 Enter 按「回標題」時，Host 會在下一幀補呼叫 start()，要忽略。 */
  private readyAt = 0;
  private controller: DinoSushiController = NOOP_CONTROLLER;

  constructor(private readonly options: GameCreateOptions) {}

  getStatus(): GameStatus {
    return this.status;
  }

  /** 沒有分數排名。 */
  getScore(): number {
    return 0;
  }

  getLevelIndex(): number {
    return DINO_SUSHI_LEVEL_INDEX;
  }

  showsScore(): boolean {
    return false;
  }

  /** Host 在 ready/won/over 按 Enter 也會呼叫；必須冪等。 */
  start(): void {
    if (this.status === "playing" || this.status === "paused") return;
    if (this.screen === "title") {
      if (Date.now() - this.readyAt < TITLE_ENTER_GRACE_MS) return;
      this.controller.startOrder();
      return;
    }
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
    this.controller = NOOP_CONTROLLER;
  }

  /** 沒有方向鍵玩法；按鍵由 View 的按鈕處理。 */
  setAction(): void {}

  registerController(ctrl: DinoSushiController): void {
    this.controller = ctrl;
  }

  notifyReady(): void {
    this.readyAt = Date.now();
    this.screen = "title";
    this.paused = false;
    this.status = "ready";
  }

  /** 每輪開始都重置回報去重。 */
  notifyPlaying(mode: Mode): void {
    this.mode = mode;
    this.screen = "kitchen";
    this.paused = false;
    this.sessionReported = false;
    this.status = "playing";
  }

  /** 自由做：第一盤送出就記「玩過」與活動紀錄，不給星。 */
  notifyServed(): void {
    if (this.mode !== "free" || this.sessionReported) return;
    this.sessionReported = true;
    this.options.onSession?.({ gameId: this.id, score: 0 });
  }

  /** 點餐送完 5 單。 */
  notifyWon(medals: Pick<RoundMedals, "cleared" | "flawless" | "collectedAll">): void {
    this.screen = "result";
    this.status = "won";
    if (this.sessionReported) return;
    this.sessionReported = true;
    this.options.onSession?.({
      gameId: this.id,
      score: 0,
      levelIndex: DINO_SUSHI_LEVEL_INDEX,
      cleared: medals.cleared,
      flawless: medals.flawless,
      collectedAll: medals.collectedAll,
    });
  }

  /** 自由做按「多多吃飽了」。 */
  notifyFinished(): void {
    this.screen = "result";
    this.status = "won";
  }

  isInputPaused(): boolean {
    return this.paused || this.status === "paused";
  }

  renderOverlay(props: OverlayProps) {
    return createElement(DinoSushiView, {
      ...props,
      audio: this.options.audio,
      instance: this,
    });
  }
}

export const dinoSushiAdapter: GameAdapter = {
  id: "dino-sushi",
  create(options: GameCreateOptions): GameInstance {
    return new DinoSushiInstance(options);
  },
};

export { DinoSushiInstance };
