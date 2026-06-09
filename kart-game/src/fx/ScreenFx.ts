/** 螢幕速度線／震動（Phase 1/5）。 */
export class ScreenFx {
  private shakeT = 0;
  private shakeAmp = 0;
  private linesEl: HTMLElement | null = null;
  private reduced = false;

  constructor() {
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!this.reduced) this.mountLines();
  }

  private mountLines(): void {
    this.linesEl = document.createElement("div");
    this.linesEl.className = "kart-speedlines";
    this.linesEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.linesEl);
    if (!document.getElementById("kart-speedlines-css")) {
      const s = document.createElement("style");
      s.id = "kart-speedlines-css";
      s.textContent = `
        .kart-speedlines{pointer-events:none;position:fixed;inset:0;z-index:5;opacity:0;transition:opacity .15s;
          background:repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.03) 40px,rgba(255,255,255,.03) 41px);}
        .kart-speedlines--on{opacity:1;}
      `;
      document.head.appendChild(s);
    }
  }

  setBoost(on: boolean, speed01: number): void {
    if (this.reduced || !this.linesEl) return;
    this.linesEl.classList.toggle("kart-speedlines--on", on || speed01 > 0.65);
  }

  bump(intensity = 0.15): void {
    if (this.reduced) return;
    this.shakeT = 0.2;
    this.shakeAmp = intensity;
  }

  update(dt: number): { x: number; y: number } {
    if (this.shakeT <= 0) return { x: 0, y: 0 };
    this.shakeT -= dt;
    const a = this.shakeAmp * (this.shakeT / 0.2);
    return {
      x: (Math.random() - 0.5) * a * 8,
      y: (Math.random() - 0.5) * a * 6,
    };
  }

  dispose(): void {
    this.linesEl?.remove();
    this.linesEl = null;
  }
}
