/** 預載與載入畫面（Phase 5）。 */
export class Assets {
  private overlay: HTMLElement | null = null;

  async load(steps: { label: string; run: () => void | Promise<void> }[]): Promise<void> {
    this.show();
    let done = 0;
    for (const step of steps) {
      this.setProgress(done, steps.length, step.label);
      await step.run();
      done++;
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    }
    this.setProgress(steps.length, steps.length, "完成！");
    await new Promise((r) => setTimeout(r, 200));
    this.hide();
  }

  private show(): void {
    if (this.overlay) return;
    this.overlay = document.createElement("div");
    this.overlay.className = "kart-load";
    this.overlay.innerHTML = `
      <div class="kart-load__box" role="status" aria-live="polite">
        <p class="kart-load__title">🏎️ 車車卡丁車</p>
        <p class="kart-load__label" data-label>載入中…</p>
        <div class="kart-load__bar"><div class="kart-load__fill" data-fill></div></div>
      </div>
    `;
    document.body.appendChild(this.overlay);
    if (!document.getElementById("kart-load-css")) {
      const s = document.createElement("style");
      s.id = "kart-load-css";
      s.textContent = `
        .kart-load{position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:linear-gradient(160deg,#87ceeb,#b8e8ff);}
        .kart-load__box{padding:1.5rem 2rem;border-radius:16px;background:rgba(255,255,255,.92);box-shadow:0 12px 40px rgba(0,0,0,.12);min-width:16rem;text-align:center;}
        .kart-load__title{font-weight:800;font-size:1.2rem;margin:0 0 .5rem;}
        .kart-load__label{font-size:.9rem;color:#475569;margin:0 0 .75rem;}
        .kart-load__bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden;}
        .kart-load__fill{height:100%;width:0%;background:linear-gradient(90deg,#38bdf8,#818cf8);transition:width .2s;}
      `;
      document.head.appendChild(s);
    }
  }

  private setProgress(done: number, total: number, label: string): void {
    if (!this.overlay) return;
    const fill = this.overlay.querySelector<HTMLElement>("[data-fill]");
    const lab = this.overlay.querySelector<HTMLElement>("[data-label]");
    if (fill) fill.style.width = `${Math.round((done / total) * 100)}%`;
    if (lab) lab.textContent = label;
  }

  private hide(): void {
    this.overlay?.remove();
    this.overlay = null;
  }
}
