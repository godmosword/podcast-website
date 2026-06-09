import { FIXED_DT, MAX_FRAME_STEPS, TARGET_FPS } from "./constants";

export type GameLoopCallbacks = {
  /** 固定步進邏輯更新；dt 恆為 FIXED_DT。 */
  fixedUpdate: (dt: number) => void;
  /** 渲染；alpha 為兩步之間插值係數 [0, 1)。 */
  render: (alpha: number) => void;
  /** 可選：每 rAF 一次（UI、輸入邊緣）。 */
  frame?: () => void;
};

/**
 * 固定時間步進 + 渲染插值（Phase 0 骨架）。
 * 目標 60fps 顯示，邏輯 120Hz。
 */
export class GameLoop {
  private running = false;
  private paused = false;
  private rafId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;
  private callbacks: GameLoopCallbacks | null = null;

  start(callbacks: GameLoopCallbacks): void {
    this.stop();
    this.callbacks = callbacks;
    this.running = true;
    this.paused = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  get isRunning(): boolean {
    return this.running;
  }

  private tick = (time: number): void => {
    if (!this.running || !this.callbacks) return;

    if (this.paused) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    if (this.lastTime === 0) {
      this.lastTime = time;
    }

    let frameTime = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // 避免背景 tab 回來時一次跳太多步。
    const maxFrameTime = (1 / TARGET_FPS) * MAX_FRAME_STEPS;
    if (frameTime > maxFrameTime) {
      frameTime = maxFrameTime;
    }

    this.accumulator += frameTime;

    let steps = 0;
    while (this.accumulator >= FIXED_DT && steps < MAX_FRAME_STEPS) {
      this.callbacks.fixedUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
      steps += 1;
    }

    const alpha = FIXED_DT > 0 ? this.accumulator / FIXED_DT : 0;
    this.callbacks.render(alpha);
    this.callbacks.frame?.();

    this.rafId = requestAnimationFrame(this.tick);
  };
}
