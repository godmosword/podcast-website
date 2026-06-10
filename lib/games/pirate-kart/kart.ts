import type { Cannonball, Keys } from "./types";

// ── Kart 類別（核心載具）────────────────────────────────────
export class Kart {
  id: string;
  name: string;
  isPlayer: boolean;
  color: string;
  sailColor: string;
  x: number;
  y: number;
  angle = 0;
  speed = 0;
  lap = 0;
  checkpoint = -1;
  score = 0;
  treasures = 0;
  boostTimer = 0;
  boostCd = 0;
  stunTimer = 0;
  fireCd = 0;
  finished = false;
  finishPos = 0;
  wp = 0;
  skill = 0.6;

  constructor(opts: {
    id: string;
    name: string;
    isPlayer: boolean;
    color: string;
    sailColor: string;
    x: number;
    y: number;
    angle?: number;
    skill?: number;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.isPlayer = opts.isPlayer;
    this.color = opts.color;
    this.sailColor = opts.sailColor;
    this.x = opts.x;
    this.y = opts.y;
    this.angle = opts.angle ?? 0;
    this.skill = opts.skill ?? 0.6;
  }

  get maxSpeed(): number {
    const base = this.isPlayer ? 3.4 : 3.0 + this.skill * 0.35;
    return this.boostTimer > 0 ? base * 1.55 : base;
  }

  update(dt: number, input: Keys | null, onTrack: boolean): void {
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.speed *= 0.9;
      this.integrate(dt);
      return;
    }

    if (this.boostTimer > 0) this.boostTimer -= dt;
    if (this.boostCd > 0) this.boostCd -= dt;
    if (this.fireCd > 0) this.fireCd -= dt;

    const turnRate = 2.8 * dt * (0.45 + Math.min(1, Math.abs(this.speed) / 2.5));
    const accel = 7.5 * dt;
    const brake = 10 * dt;
    const drag = onTrack ? 0.88 : 0.78;

    if (input) {
      if (input.left) this.angle -= turnRate;
      if (input.right) this.angle += turnRate;
      if (input.up) this.speed += accel;
      else if (input.down) this.speed -= brake;
      else this.speed *= drag;

      if (input.boost && this.boostCd <= 0 && this.boostTimer <= 0) {
        this.boostTimer = 1.2;
        this.boostCd = 3.2;
      }
    } else {
      this.speed *= drag;
    }

    const cap = this.maxSpeed;
    this.speed = Math.max(-1.2, Math.min(cap, this.speed));
  }

  integrate(dt: number): void {
    const vx = Math.sin(this.angle) * this.speed;
    const vy = -Math.cos(this.angle) * this.speed;
    this.x += vx * dt * 60;
    this.y += vy * dt * 60;
  }

  tryFire(balls: Cannonball[]): boolean {
    if (this.fireCd > 0 || this.stunTimer > 0) return false;
    this.fireCd = 0.75;
    const spd = 6.5;
    balls.push({
      x: this.x + Math.sin(this.angle) * 10,
      y: this.y - Math.cos(this.angle) * 10,
      vx: Math.sin(this.angle) * spd,
      vy: -Math.cos(this.angle) * spd,
      owner: this.id,
      life: 1.8,
    });
    return true;
  }
}
