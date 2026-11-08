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
import type { GameSessionResult } from "@/lib/gamekit/progress/session";
import { SessionOutbox } from "@/lib/gamekit/progress/session-outbox";
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

/**
 * Host 在 ready/won/over 按 Enter 一律呼叫 start()，不看焦點在哪。結算畫面上焦點在按鈕或連結
 * （放進貼紙書、+N、回標題、貼紙書格子）時，Enter 要交給那顆鈕自己（同方塊轉轉的做法），
 * 不然會跟按鈕搶，有時直接開了新的一輪。
 */
function focusOnControl(): boolean {
  if (typeof document === "undefined") return false;
  const el = document.activeElement;
  return el != null && el !== document.body && el.closest("button, a") !== null;
}

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
  /** 寫不進存檔的回報。留到「再存一次」或下一次回報一起補，順序不變。 */
  private readonly outbox: SessionOutbox;
  /** 剛回到標題的時間：結算畫面用 Enter 按「回標題」時，Host 會在下一幀補呼叫 start()，要忽略。 */
  private readyAt = 0;
  /** 剛進結算的時間：用 Enter 按「多多吃飽了」會立刻結算，Host 下一幀又把同一次 Enter 當 start()，要忽略。 */
  private resultAt = 0;
  private controller: DinoSushiController = NOOP_CONTROLLER;

  constructor(private readonly options: GameCreateOptions) {
    this.outbox = new SessionOutbox((result) => options.onSession?.(result));
  }

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

  /** 把還沒寫進去的回報再寫一次。全部寫好回傳 true；localStorage 滿了也不丟例外。 */
  flushSessions(): boolean {
    return this.outbox.flush();
  }

  /** 一輪只報一次。回傳 false＝有東西沒寫進去，由 View 提示再存一次。 */
  private reportOnce(result: GameSessionResult): boolean {
    if (this.sessionReported) return this.outbox.flush();
    this.sessionReported = true;
    return this.outbox.push(result);
  }

  /** 自由做：第一盤送出就記「玩過」與活動紀錄，不給星。寫不進去就排著，吃飽時再補、再提示。 */
  notifyServed(): void {
    if (this.mode !== "free" || this.sessionReported) return;
    this.reportOnce({ gameId: this.id, score: 0 });
  }

  /**
   * 第 1–3 天送完 5 單。星星只記在壽司屋，不走全站獎牌。
   * 不帶 levelIndex，Host 就不會把 bit OR 進 medals["dino-sushi"]。
   */
  notifyDayCleared(medals: Pick<RoundMedals, "cleared">): boolean {
    this.screen = "result";
    this.status = "won";
    this.resultAt = Date.now();
    return this.reportOnce({
      gameId: this.id,
      score: 0,
      cleared: medals.cleared,
      grantMedals: false,
    });
  }

  /** 第 4 天（舊的那一關）送完 5 單。仍回報 levelIndex 0，舊星只會 OR、不會再發一次。 */
  notifyWon(medals: Pick<RoundMedals, "cleared" | "flawless" | "collectedAll">): boolean {
    this.screen = "result";
    this.status = "won";
    this.resultAt = Date.now();
    return this.reportOnce({
      gameId: this.id,
      score: 0,
      levelIndex: DINO_SUSHI_LEVEL_INDEX,
      cleared: medals.cleared,
      flawless: medals.flawless,
      collectedAll: medals.collectedAll,
    });
  }

  /** 自由做按「多多吃飽了」。順便補第一盤沒寫進去的回報。 */
  notifyFinished(): boolean {
    this.screen = "result";
    this.status = "won";
    this.resultAt = Date.now();
    return this.flushSessions();
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
