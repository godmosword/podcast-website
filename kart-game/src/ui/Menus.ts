import { KARTS, getKart } from "../data/karts";
import { TRACKS } from "../data/tracks";
import type { KartSave, Medal } from "../core/Save";
import type { RaceFinish } from "../race/RaceDirector";

export type MenuCallbacks = {
  onStartRace: () => void;
  onOpenGarage: () => void;
  onSelectKart: (id: string) => void;
  onBackTitle: () => void;
  onToggleSound: (on: boolean) => void;
  onToggleMusic: (on: boolean) => void;
  onRematch: () => void;
};

const MEDAL_LABEL: Record<Exclude<Medal, null>, string> = {
  gold: "🥇 金牌",
  silver: "🥈 銀牌",
  bronze: "🥉 銅牌",
};

/** 標題／車庫／結算 DOM 選單（P4）。 */
export class Menus {
  private root: HTMLElement;
  private visible = false;

  constructor(
    private getSave: () => KartSave,
    private callbacks: MenuCallbacks,
  ) {
    this.root = document.createElement("div");
    this.root.className = "kart-menus";
    this.root.hidden = true;
    document.body.appendChild(this.root);
    this.injectStyles();
  }

  showTitle(): void {
    const save = this.getSave();
    const kart = getKart(save.selectedKart);
    this.render(`
      <div class="kart-menu kart-menu--title">
        <h1>🏎️ 車車卡丁車</h1>
        <p class="kart-menu__sub">原創 arcade 漂移賽車 · 單機 v1</p>
        <p class="kart-menu__kart">目前車手：${kart.emoji} ${kart.name}</p>
        <button type="button" class="kart-btn kart-btn--primary" data-action="race">開始比賽</button>
        <button type="button" class="kart-btn" data-action="garage">車庫選車</button>
        <div class="kart-menu__toggles">
          <label><input type="checkbox" data-toggle="sound" ${save.soundOn ? "checked" : ""}/> 音效</label>
          <label><input type="checkbox" data-toggle="music" ${save.musicOn ? "checked" : ""}/> 音樂</label>
        </div>
        <p class="kart-menu__hint">WASD／方向鍵 · 空白漂移 · 手把 · 觸控</p>
      </div>
    `);
    this.bindCommon();
  }

  showGarage(): void {
    const save = this.getSave();
    const cards = KARTS.map((k) => {
      const unlocked = save.unlockedKarts.includes(k.id);
      const selected = save.selectedKart === k.id;
      return `
        <button type="button" class="kart-kart-card ${selected ? "is-selected" : ""} ${unlocked ? "" : "is-locked"}"
          data-kart="${k.id}" ${unlocked ? "" : "disabled"}>
          <span class="kart-kart-card__emoji">${k.emoji}</span>
          <span class="kart-kart-card__name">${k.name}</span>
          ${selected ? '<span class="kart-kart-card__tag">已選</span>' : ""}
        </button>
      `;
    }).join("");

    this.render(`
      <div class="kart-menu kart-menu--garage">
        <h2>🛠️ 車庫</h2>
        <div class="kart-kart-grid">${cards}</div>
        <button type="button" class="kart-btn" data-action="back">返回</button>
      </div>
    `);

    this.root.querySelectorAll<HTMLButtonElement>("[data-kart]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.kart!;
        this.callbacks.onSelectKart(id);
        this.showGarage();
      });
    });
    this.bindCommon();
  }

  showResults(finish: RaceFinish, medal: Medal, trackName: string): void {
    const posLabel = finish.playerPos === 1 ? "冠軍！" : `第 ${finish.playerPos} 名`;
    const medalLine = medal ? `<p class="kart-menu__medal">${MEDAL_LABEL[medal]}</p>` : "";
    const lapLines = finish.lapTimes
      .map((ms, i) => `<li>第 ${i + 1} 圈：${formatMs(ms)}</li>`)
      .join("");

    this.render(`
      <div class="kart-menu kart-menu--results">
        <h2>🏁 比賽結束</h2>
        <p class="kart-menu__pos">${posLabel}</p>
        <p class="kart-menu__track">${trackName}</p>
        ${medalLine}
        <ul class="kart-menu__laps">${lapLines}</ul>
        <p>總時間 <strong>${formatMs(finish.totalMs)}</strong> · 最佳單圈 <strong>${formatMs(finish.bestLapMs)}</strong></p>
        <button type="button" class="kart-btn kart-btn--primary" data-action="rematch">再比一場</button>
        <button type="button" class="kart-btn" data-action="back">回主選單</button>
      </div>
    `);
    this.bindCommon();
  }

  hide(): void {
    this.root.hidden = true;
    this.visible = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  private render(html: string): void {
    this.root.innerHTML = html;
    this.root.hidden = false;
    this.visible = true;
  }

  private bindCommon(): void {
    this.root.querySelector<HTMLButtonElement>('[data-action="race"]')?.addEventListener("click", () => {
      this.hide();
      this.callbacks.onStartRace();
    });
    this.root.querySelector<HTMLButtonElement>('[data-action="garage"]')?.addEventListener("click", () => {
      this.callbacks.onOpenGarage();
    });
    this.root.querySelector<HTMLButtonElement>('[data-action="back"]')?.addEventListener("click", () => {
      this.callbacks.onBackTitle();
    });
    this.root.querySelector<HTMLButtonElement>('[data-action="rematch"]')?.addEventListener("click", () => {
      this.hide();
      this.callbacks.onRematch();
    });
    this.root.querySelector<HTMLInputElement>('[data-toggle="sound"]')?.addEventListener("change", (e) => {
      this.callbacks.onToggleSound((e.target as HTMLInputElement).checked);
    });
    this.root.querySelector<HTMLInputElement>('[data-toggle="music"]')?.addEventListener("change", (e) => {
      this.callbacks.onToggleMusic((e.target as HTMLInputElement).checked);
    });
  }

  private injectStyles(): void {
    if (document.getElementById("kart-menus-style")) return;
    const style = document.createElement("style");
    style.id = "kart-menus-style";
    style.textContent = `
      .kart-menus {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(15,23,42,0.35);
        backdrop-filter: blur(4px);
      }
      .kart-menus[hidden] { display: none !important; }
      .kart-menu {
        width: min(22rem, 100%);
        padding: 1.25rem 1.5rem;
        border-radius: 18px;
        background: rgba(255,255,255,0.96);
        box-shadow: 0 16px 48px rgba(0,0,0,0.18);
        text-align: center;
        color: #1e293b;
      }
      .kart-menu h1, .kart-menu h2 { margin: 0 0 0.5rem; font-weight: 800; }
      .kart-menu__sub { color: #64748b; margin: 0 0 0.75rem; font-size: 0.9rem; }
      .kart-menu__kart { font-weight: 700; margin: 0 0 1rem; }
      .kart-menu__pos { font-size: 1.5rem; font-weight: 800; color: #0369a1; margin: 0.25rem 0; }
      .kart-menu__medal { font-size: 1.1rem; font-weight: 700; margin: 0.35rem 0; }
      .kart-menu__track { color: #475569; margin: 0 0 0.5rem; }
      .kart-menu__laps { list-style: none; padding: 0; margin: 0.5rem 0; font-size: 0.9rem; color: #334155; }
      .kart-menu__hint { font-size: 0.75rem; color: #94a3b8; margin: 0.75rem 0 0; }
      .kart-menu__toggles { display: flex; gap: 1rem; justify-content: center; margin: 0.75rem 0; font-size: 0.9rem; }
      .kart-btn {
        display: block;
        width: 100%;
        margin: 0.35rem 0;
        padding: 0.7rem 1rem;
        border: none;
        border-radius: 12px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        background: #e2e8f0;
        color: #1e293b;
      }
      .kart-btn--primary { background: linear-gradient(90deg,#38bdf8,#818cf8); color: #fff; }
      .kart-kart-grid { display: grid; gap: 0.5rem; margin: 0.75rem 0 1rem; }
      .kart-kart-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.85rem;
        border-radius: 12px;
        border: 2px solid #e2e8f0;
        background: #f8fafc;
        cursor: pointer;
        text-align: left;
      }
      .kart-kart-card.is-selected { border-color: #38bdf8; background: #eff6ff; }
      .kart-kart-card.is-locked { opacity: 0.45; cursor: not-allowed; }
      .kart-kart-card__emoji { font-size: 1.4rem; }
      .kart-kart-card__name { font-weight: 700; flex: 1; }
      .kart-kart-card__tag { font-size: 0.7rem; color: #0369a1; font-weight: 700; }
      @media (prefers-reduced-motion: reduce) {
        .kart-menus { backdrop-filter: none; }
      }
    `;
    document.head.appendChild(style);
  }

  dispose(): void {
    this.root.remove();
  }
}

function formatMs(ms: number): string {
  const s = ms / 1000;
  const m = Math.floor(s / 60);
  const r = (s % 60).toFixed(2);
  return m > 0 ? `${m}:${r.padStart(5, "0")}` : `${r}s`;
}
