import type { GameAction } from "../types";

const KEY_MAP: Record<string, GameAction> = {
  arrowleft: "move-left",
  a: "move-left",
  arrowright: "move-right",
  d: "move-right",
  arrowup: "move-up",
  w: "move-up",
  arrowdown: "move-down",
  s: "move-down",
  " ": "action",
  enter: "confirm",
  escape: "pause",
  p: "pause",
};

const GAMEPAD_BUTTON_MAP: Partial<Record<number, GameAction>> = {
  0: "action",
  1: "cancel",
  9: "pause",
  12: "move-up",
  13: "move-down",
  14: "move-left",
  15: "move-right",
};

export type InputManagerOptions = {
  /** 死區（類比搖桿）。 */
  stickDeadZone?: number;
};

/**
 * 鍵盤 + Gamepad 統一 action 輪詢（觸控由各遊戲 UI 轉成 action 注入）。
 */
export class InputManager {
  private held = new Set<GameAction>();
  private pressed = new Set<GameAction>();
  private released = new Set<GameAction>();
  private stickDeadZone: number;
  private bound = false;
  private onKeyDown = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key.toLowerCase()];
    if (!action) return;
    if (!this.held.has(action)) {
      this.pressed.add(action);
    }
    this.held.add(action);
    if (
      action === "move-up" ||
      action === "move-down" ||
      action === "move-left" ||
      action === "move-right"
    ) {
      e.preventDefault();
    }
  };
  private onKeyUp = (e: KeyboardEvent) => {
    const action = KEY_MAP[e.key.toLowerCase()];
    if (!action) return;
    this.held.delete(action);
    this.released.add(action);
  };

  constructor(options: InputManagerOptions = {}) {
    this.stickDeadZone = options.stickDeadZone ?? 0.35;
  }

  attach(): void {
    if (this.bound || typeof window === "undefined") return;
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    this.bound = true;
  }

  detach(): void {
    if (!this.bound || typeof window === "undefined") return;
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    this.bound = false;
  }

  /** 注入觸控／UI 產生的 action（每幀開始前呼叫 clearFrame 後再 inject）。 */
  inject(action: GameAction, phase: "down" | "up" | "hold" = "hold"): void {
    if (phase === "down") {
      if (!this.held.has(action)) this.pressed.add(action);
      this.held.add(action);
    } else if (phase === "up") {
      this.held.delete(action);
      this.released.add(action);
    } else {
      this.held.add(action);
    }
  }

  clearFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  poll(): Set<GameAction> {
    this.pollGamepad();
    return new Set(this.held);
  }

  wasPressed(action: GameAction): boolean {
    return this.pressed.has(action);
  }

  wasReleased(action: GameAction): boolean {
    return this.released.has(action);
  }

  isHeld(action: GameAction): boolean {
    return this.held.has(action);
  }

  private pollGamepad(): void {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (!pad) continue;
      pad.buttons.forEach((btn, i) => {
        const action = GAMEPAD_BUTTON_MAP[i];
        if (!action) return;
        if (btn.pressed) {
          if (!this.held.has(action)) this.pressed.add(action);
          this.held.add(action);
        } else if (this.held.has(action)) {
          this.held.delete(action);
          this.released.add(action);
        }
      });

      const lx = pad.axes[0] ?? 0;
      const ly = pad.axes[1] ?? 0;
      this.applyStickAxis("move-left", "move-right", lx);
      this.applyStickAxis("move-up", "move-down", ly);
    }
  }

  private applyStickAxis(
    negative: GameAction,
    positive: GameAction,
    value: number,
  ): void {
    if (value < -this.stickDeadZone) {
      this.inject(negative, "hold");
    } else if (value > this.stickDeadZone) {
      this.inject(positive, "hold");
    }
  }
}
