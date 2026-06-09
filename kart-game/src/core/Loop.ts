import { PHYSICS } from "../data/config";

export type LoopCallbacks = {
  fixedUpdate: (dt: number) => void;
  render: (alpha: number) => void;
  frame?: () => void;
};

/** 固定 60Hz 模擬 + 渲染插值（與主站 Game Kit 同思路）。 */
export class Loop {
  private running = false;
  private rafId = 0;
  private lastTime = 0;
  private accumulator = 0;
  private callbacks: LoopCallbacks | null = null;

  start(callbacks: LoopCallbacks): void {
    this.stop();
    this.callbacks = callbacks;
    this.running = true;
    this.lastTime = 0;
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  private tick = (time: number): void => {
    if (!this.running || !this.callbacks) return;

    if (this.lastTime === 0) this.lastTime = time;
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;
    if (dt > PHYSICS.maxFrameDt) dt = PHYSICS.maxFrameDt;

    this.accumulator += dt;
    const step = PHYSICS.step;
    let steps = 0;
    while (this.accumulator >= step && steps < 8) {
      this.callbacks.fixedUpdate(step);
      this.accumulator -= step;
      steps += 1;
    }

    const alpha = step > 0 ? this.accumulator / step : 0;
    this.callbacks.render(alpha);
    this.callbacks.frame?.();
    this.rafId = requestAnimationFrame(this.tick);
  };
}
