import type { RacePhase } from "../race/RaceDirector";

export type HudState = {
  speedKmh: number;
  boost: number;
  drifting: boolean;
  offTrack: boolean;
  phase: RacePhase;
  countdown: number;
  lap: number;
  totalLaps: number;
  position: number;
  racerCount: number;
  lapMs: number;
  raceMs: number;
};

export class Hud {
  private root: HTMLElement;
  private speedEl: HTMLElement;
  private statusEl: HTMLElement;
  private raceEl: HTMLElement;
  private countdownEl: HTMLElement;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "kart-hud";
    this.root.innerHTML = `
      <div class="kart-hud__countdown" data-countdown hidden></div>
      <div class="kart-hud__panel">
        <p class="kart-hud__race" data-race></p>
        <p class="kart-hud__speed" aria-live="polite"><span data-speed>0</span> km/h</p>
        <p class="kart-hud__status" data-status></p>
        <p class="kart-hud__hint">空白／B 漂移蓄力 · Shift／A 道具</p>
      </div>
    `;
    document.body.appendChild(this.root);
    this.injectStyles();
    this.speedEl = this.root.querySelector("[data-speed]")!;
    this.statusEl = this.root.querySelector("[data-status]")!;
    this.raceEl = this.root.querySelector("[data-race]")!;
    this.countdownEl = this.root.querySelector("[data-countdown]")!;
  }

  update(state: HudState): void {
    this.speedEl.textContent = String(Math.round(state.speedKmh));

    const parts: string[] = [];
    if (state.drifting) parts.push("漂移蓄力");
    if (state.boost > 0) parts.push("迷你加速");
    if (state.offTrack) parts.push("離開賽道");
    this.statusEl.textContent = parts.join(" · ");

    this.raceEl.textContent = `第 ${Math.min(state.lap + 1, state.totalLaps)}/${state.totalLaps} 圈 · 名次 ${state.position}/${state.racerCount} · 單圈 ${formatMs(state.lapMs)}`;

    if (state.phase === "countdown" && state.countdown > 0) {
      this.countdownEl.hidden = false;
      this.countdownEl.textContent = String(state.countdown);
    } else if (state.phase === "countdown") {
      this.countdownEl.hidden = false;
      this.countdownEl.textContent = "GO!";
    } else {
      this.countdownEl.hidden = true;
    }
  }

  setVisible(on: boolean): void {
    this.root.style.display = on ? "" : "none";
  }

  private injectStyles(): void {
    if (document.getElementById("kart-hud-style")) return;
    const style = document.createElement("style");
    style.id = "kart-hud-style";
    style.textContent = `
      .kart-hud {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 10;
        padding: max(12px, env(safe-area-inset-top)) 12px 12px;
      }
      .kart-hud__countdown {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: clamp(3rem, 12vw, 6rem);
        font-weight: 900;
        color: #fff;
        text-shadow: 0 4px 24px rgba(0,0,0,0.35);
      }
      .kart-hud__panel {
        max-width: 18rem;
        padding: 0.75rem 1rem;
        border-radius: 14px;
        background: rgba(255,255,255,0.88);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        color: #1e293b;
      }
      .kart-hud__race { font-weight: 700; font-size: 0.85rem; margin: 0 0 0.35rem; color: #0369a1; }
      .kart-hud__speed { font-size: 1.75rem; font-weight: 800; margin: 0; }
      .kart-hud__status { font-size: 0.85rem; font-weight: 600; color: #0f766e; min-height: 1.2em; margin: 0.25rem 0; }
      .kart-hud__hint { font-size: 0.72rem; color: #64748b; margin: 0.35rem 0 0; line-height: 1.35; }
      @media (prefers-reduced-motion: reduce) {
        .kart-hud__panel { backdrop-filter: none; }
      }
    `;
    document.head.appendChild(style);
  }

  dispose(): void {
    this.root.remove();
  }
}

function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}
