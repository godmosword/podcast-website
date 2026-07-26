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
import type { AdventureSessionPayload } from "@/lib/games/car-adventure/physics";
import { updateAdventure } from "@/lib/games/car-adventure/physics";
import {
  drawAdventureHud,
  renderAdventureWorld,
} from "@/lib/games/car-adventure/render";
import {
  createGameState,
  RENDER_SX,
  RENDER_SY,
  type GameState,
  type Status,
} from "@/lib/games/car-adventure/types";
import { JuiceController } from "@/lib/gamekit/runtime/juice";
import {
  CarAdventureView,
  type CarAdventureController,
} from "@/components/games/CarAdventureView";

/** 局內 Status 與 GameStatus 1:1。 */
export const CAR_ADVENTURE_STATUS_MAP = {
  ready: "ready",
  playing: "playing",
  paused: "paused",
  won: "won",
  over: "over",
} as const satisfies Record<Status, GameStatus>;

class CarAdventureInstance implements GameInstance {
  readonly id = "car-adventure" as const;

  private status: GameStatus = "ready";
  private score = 0;
  private levelIndex = 0;
  private game: GameState | null = null;
  private levelStartLives = 3;
  private juice = new JuiceController();
  private skipPhysics = false;
  private controller: CarAdventureController | null = null;
  private syncHost: (() => void) | null = null;
  private onStars: ((levelIndex: number, stars: number) => void) | null = null;

  constructor(private readonly options: GameCreateOptions) {
    if (options.levelIndex !== undefined) {
      this.levelIndex = options.levelIndex;
    }
  }

  getStatus(): GameStatus {
    return this.status;
  }

  getScore(): number {
    return this.score;
  }

  getLevelIndex(): number {
    return this.levelIndex;
  }

  /** Overlay 註冊：星數存檔、Host 同步。 */
  registerController(ctrl: CarAdventureController): void {
    this.controller = ctrl;
    this.onStars = ctrl.onStars;
  }

  selectLevel(index: number): void {
    this.levelIndex = index;
  }

  start(levelIndex?: number): void {
    const idx = levelIndex ?? this.levelIndex;
    this.beginLevel(idx);
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.status = "paused";
  }

  resume(): void {
    if (this.status !== "paused") return;
    if (this.game) this.game.last = null;
    this.status = "playing";
  }

  restart(levelIndex?: number): void {
    this.beginLevel(levelIndex ?? this.levelIndex);
  }

  dispose(): void {
    this.game = null;
    this.controller = null;
    this.syncHost = null;
    this.onStars = null;
  }

  setAction(action: GameAction, pressed: boolean): void {
    if (this.status === "ready" || this.status === "won" || this.status === "over") {
      if (pressed && action === "confirm") {
        this.beginLevel(this.levelIndex);
      }
      return;
    }
    if (this.status === "paused") return;
    if (this.status !== "playing" || !this.game) return;

    const inp = this.game.input;
    if (action === "move-left") inp.left = pressed;
    else if (action === "move-right") inp.right = pressed;
    else if (action === "move-up" || action === "action") inp.jump = pressed;
    else if (action === "dash") inp.dash = pressed;
  }

  getTouchActions(): readonly GameAction[] {
    // 觸控列由 CarAdventureView 自管（繁中 label／衝刺文案），避免 Host 雙重列。
    return [];
  }

  fixedUpdate(dt: number): void {
    if (this.status !== "playing" || !this.game) return;
    if (this.skipPhysics) {
      this.skipPhysics = false;
      return;
    }
    this.game.prevPlayer = {
      x: this.game.player.x,
      y: this.game.player.y,
    };
    this.tick(dt);
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    const g = this.game;
    if (!g) {
      ctx.fillStyle = "#8fd3ff";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    const reduced = this.options.reducedMotion;
    const j = reduced
      ? { shakeX: 0, shakeY: 0, skipLogic: false }
      : this.juice.update(1 / 60);
    if (j.skipLogic) this.skipPhysics = true;

    g.renderAlpha = alpha;
    ctx.fillStyle = "#8fd3ff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.save();
    ctx.scale(RENDER_SX, RENDER_SY);
    ctx.translate(j.shakeX / RENDER_SX, j.shakeY / RENDER_SY);
    renderAdventureWorld(ctx, g, reduced);
    if (!reduced) this.juice.draw(ctx);
    ctx.restore();
    drawAdventureHud(ctx, g);
  }

  renderOverlay(props: OverlayProps) {
    this.syncHost = props.syncHost;
    return createElement(CarAdventureView, {
      ...props,
      audio: this.options.audio,
      instance: this,
    });
  }

  /** E2E：把玩家瞬移到終點附近，仍走正常結算。 */
  debugFinish(): void {
    const g = this.game;
    if (!g || this.status !== "playing" || g.finishCleared) return;
    g.player.x = g.lv.finish.x + g.player.w;
    g.player.y = g.lv.finish.y;
    g.player.vx = 0;
    g.player.vy = 0;
    g.taken = g.lv.total;
  }

  private beginLevel(idx: number): void {
    this.options.audio?.ensureAudio();
    this.levelIndex = idx;
    const startLives = this.options.kidsMode ? 5 : 3;
    this.levelStartLives = startLives;
    this.game = createGameState(idx, startLives, this.options.kidsMode);
    this.score = this.game.score;
    this.status = "playing";
    this.syncHost?.();
  }

  private setStat(s: Status): void {
    this.status = CAR_ADVENTURE_STATUS_MAP[s];
    if (this.game) this.score = this.game.score;
    this.syncHost?.();
  }

  /** 物理／測試用：轉發 onSession（含 gameId）。 */
  notifySession(payload: AdventureSessionPayload): void {
    this.options.onSession?.({
      gameId: "car-adventure",
      ...payload,
    });
  }

  private tick(dt: number): void {
    const g = this.game;
    if (!g) return;
    const audio = this.options.audio;
    updateAdventure(g, dt, {
      reduced: this.options.reducedMotion,
      juice: this.juice,
      levelStartLives: this.levelStartLives,
      onJump: () => audio?.tone(520, 0.12, "square", 0.04),
      onCoin: () => audio?.tone(880, 0.08, "triangle", 0.05),
      onStomp: () => audio?.tone(300, 0.1, "square", 0.05),
      onHurt: () => audio?.tone(180, 0.3, "sawtooth", 0.06),
      onWin: () => {
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => audio?.tone(f, 0.2, "triangle", 0.06), i * 130);
        });
      },
      onStars: (levelIndex, stars) => {
        this.onStars?.(levelIndex, stars);
      },
      onSession: (payload) => this.notifySession(payload),
      setStatus: (s) => this.setStat(s),
      onAdvanceLevel: (next) => {
        this.levelIndex = next;
        this.levelStartLives = g.lives;
        this.status = "playing";
        this.score = g.score;
        this.controller?.onLevelAdvanced?.(next);
        this.syncHost?.();
      },
    });
    this.score = g.score;
  }
}

export const carAdventureAdapter: GameAdapter = {
  id: "car-adventure",
  create(options: GameCreateOptions): GameInstance {
    return new CarAdventureInstance(options);
  },
};

export { CarAdventureInstance };
