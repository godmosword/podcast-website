import { snapPixel } from "./palette";

export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
};

/** 簡易粒子池（Phase 4 juice）。 */
export class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];

  constructor(capacity = 128) {
    for (let i = 0; i < capacity; i += 1) {
      this.pool.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 0,
        color: "#ffd166",
        size: 2,
      });
    }
  }

  emit(
    x: number,
    y: number,
    options: Partial<Pick<Particle, "vx" | "vy" | "life" | "color" | "size">> = {},
  ): void {
    const p = this.pool.pop();
    if (!p) return;
    p.x = x;
    p.y = y;
    p.vx = options.vx ?? (Math.random() - 0.5) * 2;
    p.vy = options.vy ?? -Math.random() * 2 - 0.5;
    p.maxLife = options.life ?? 0.4;
    p.life = p.maxLife;
    p.color = options.color ?? "#ffd166";
    p.size = options.size ?? 2;
    this.active.push(p);
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const p = this.active[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.active.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    for (const p of this.active) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = snapPixel(p.size);
      ctx.fillRect(snapPixel(p.x), snapPixel(p.y), s, s);
    }
    ctx.restore();
  }
}

export class ScreenShake {
  private duration = 0;
  private magnitude = 0;

  trigger(duration = 0.15, magnitude = 3): void {
    this.duration = Math.max(this.duration, duration);
    this.magnitude = Math.max(this.magnitude, magnitude);
  }

  update(dt: number): { x: number; y: number } {
    if (this.duration <= 0) return { x: 0, y: 0 };
    this.duration -= dt;
    const x = (Math.random() - 0.5) * this.magnitude * 2;
    const y = (Math.random() - 0.5) * this.magnitude * 2;
    if (this.duration <= 0) this.magnitude = 0;
    return { x: snapPixel(x), y: snapPixel(y) };
  }
}

export class Hitstop {
  private remaining = 0;

  trigger(seconds = 0.05): void {
    this.remaining = Math.max(this.remaining, seconds);
  }

  /** 回傳本幀是否應跳過邏輯更新。 */
  consume(dt: number): boolean {
    if (this.remaining <= 0) return false;
    this.remaining -= dt;
    return true;
  }
}

export class JuiceController {
  readonly particles = new ParticlePool();
  readonly shake = new ScreenShake();
  readonly hitstop = new Hitstop();

  update(dt: number): { shakeX: number; shakeY: number; skipLogic: boolean } {
    this.particles.update(dt);
    const { x, y } = this.shake.update(dt);
    const skipLogic = this.hitstop.consume(dt);
    return { shakeX: x, shakeY: y, skipLogic };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particles.draw(ctx);
  }
}
