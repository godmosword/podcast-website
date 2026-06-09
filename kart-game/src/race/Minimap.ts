import type { Racer } from "./RaceDirector";
import type { Track } from "./Track";

/** 右上角小地圖（P2）。 */
export class Minimap {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "kart-minimap";
    this.canvas = document.createElement("canvas");
    this.canvas.width = 120;
    this.canvas.height = 120;
    this.root.appendChild(this.canvas);
    document.body.appendChild(this.root);
    this.ctx = this.canvas.getContext("2d")!;
    this.injectStyles();
  }

  update(track: Track, racers: Racer[]): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const pts = track.centerLine;
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minZ = Math.min(minZ, p.y);
      maxZ = Math.max(maxZ, p.y);
    }
    const pad = 8;
    const sx = (w - pad * 2) / (maxX - minX || 1);
    const sz = (h - pad * 2) / (maxZ - minZ || 1);
    const scale = Math.min(sx, sz);
    const ox = (w - (maxX - minX) * scale) * 0.5;
    const oz = (h - (maxZ - minZ) * scale) * 0.5;

    const map = (x: number, z: number): [number, number] => [
      ox + (x - minX) * scale,
      oz + (z - minZ) * scale,
    ];

    ctx.strokeStyle = "rgba(71,85,105,0.9)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const [mx, mz] = map(pts[i].x, pts[i].y);
      if (i === 0) ctx.moveTo(mx, mz);
      else ctx.lineTo(mx, mz);
    }
    ctx.closePath();
    ctx.stroke();

    for (const racer of racers) {
      const [mx, mz] = map(racer.state.pos.x, racer.state.pos.z);
      ctx.fillStyle = racer.isPlayer ? "#ef4444" : "#3b82f6";
      ctx.beginPath();
      ctx.arc(mx, mz, racer.isPlayer ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private injectStyles(): void {
    if (document.getElementById("kart-minimap-style")) return;
    const style = document.createElement("style");
    style.id = "kart-minimap-style";
    style.textContent = `
      .kart-minimap {
        position: fixed;
        top: max(12px, env(safe-area-inset-top));
        right: 12px;
        z-index: 11;
        pointer-events: none;
        border-radius: 12px;
        overflow: hidden;
        background: rgba(255,255,255,0.85);
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
        padding: 4px;
      }
    `;
    document.head.appendChild(style);
  }

  dispose(): void {
    this.root.remove();
  }
}
