export type KartInput = {
  throttle: number;
  brake: number;
  steer: number;
  handbrake: boolean;
  item: boolean;
};

const KEY_MAP: Record<string, Partial<KartInput>> = {
  w: { throttle: 1 },
  arrowup: { throttle: 1 },
  s: { brake: 1 },
  arrowdown: { brake: 1 },
  a: { steer: -1 },
  arrowleft: { steer: -1 },
  d: { steer: 1 },
  arrowright: { steer: 1 },
  " ": { handbrake: true },
  shift: { item: true },
};

export class Input {
  private held = new Map<string, boolean>();
  private bound = false;
  private touchRoot: HTMLElement | null = null;
  private touchSteer = 0;
  private touchThrottle = 0;
  private touchBrake = 0;
  private touchHandbrake = false;
  private touchItem = false;
  private stickId: number | null = null;
  private stickCenter = { x: 0, y: 0 };

  private onDown = (e: KeyboardEvent) => {
    this.held.set(e.key.toLowerCase(), true);
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(e.key.toLowerCase()) || e.key === " ") {
      e.preventDefault();
    }
  };

  private onUp = (e: KeyboardEvent) => {
    this.held.set(e.key.toLowerCase(), false);
  };

  attach(): void {
    if (this.bound) return;
    window.addEventListener("keydown", this.onDown);
    window.addEventListener("keyup", this.onUp);
    this.mountTouch();
    this.bound = true;
  }

  detach(): void {
    if (!this.bound) return;
    window.removeEventListener("keydown", this.onDown);
    window.removeEventListener("keyup", this.onUp);
    this.touchRoot?.remove();
    this.touchRoot = null;
    this.bound = false;
  }

  poll(): KartInput {
    const out: KartInput = {
      throttle: 0,
      brake: 0,
      steer: 0,
      handbrake: false,
      item: false,
    };

    for (const [key, pressed] of this.held) {
      if (!pressed) continue;
      const patch = KEY_MAP[key];
      if (!patch) continue;
      if (patch.throttle) out.throttle = Math.max(out.throttle, patch.throttle);
      if (patch.brake) out.brake = Math.max(out.brake, patch.brake);
      if (patch.steer !== undefined) out.steer = patch.steer;
      if (patch.handbrake) out.handbrake = true;
      if (patch.item) out.item = true;
    }

    this.pollGamepad(out);
    this.mergeTouch(out);
    return out;
  }

  private mergeTouch(out: KartInput): void {
    if (!this.touchRoot) return;
    out.throttle = Math.max(out.throttle, this.touchThrottle);
    out.brake = Math.max(out.brake, this.touchBrake);
    if (Math.abs(this.touchSteer) > Math.abs(out.steer)) out.steer = this.touchSteer;
    out.handbrake = out.handbrake || this.touchHandbrake;
    out.item = out.item || this.touchItem;
  }

  private pollGamepad(out: KartInput): void {
    const pads = navigator.getGamepads?.();
    if (!pads) return;
    for (const pad of pads) {
      if (!pad) continue;
      const lx = pad.axes[0] ?? 0;
      const rt = pad.buttons[7]?.value ?? 0;
      const lt = pad.buttons[6]?.value ?? 0;
      if (Math.abs(lx) > 0.15) out.steer = Math.abs(out.steer) > Math.abs(lx) ? out.steer : lx;
      if (rt > 0.1) out.throttle = Math.max(out.throttle, rt);
      if (lt > 0.1) out.brake = Math.max(out.brake, lt);
      if (pad.buttons[0]?.pressed) out.handbrake = true;
      if (pad.buttons[1]?.pressed) out.item = true;
    }
  }

  private mountTouch(): void {
    if (this.touchRoot || !("ontouchstart" in window)) return;
    this.touchRoot = document.createElement("div");
    this.touchRoot.className = "kart-touch";
    this.touchRoot.innerHTML = `
      <div class="kart-touch__stick" data-stick><span data-knob></span></div>
      <div class="kart-touch__right">
        <button type="button" class="kart-touch__btn" data-throttle>油門</button>
        <button type="button" class="kart-touch__btn" data-brake>煞車</button>
        <button type="button" class="kart-touch__btn kart-touch__btn--drift" data-drift>漂移</button>
      </div>
    `;
    document.body.appendChild(this.touchRoot);

    if (!document.getElementById("kart-touch-style")) {
      const s = document.createElement("style");
      s.id = "kart-touch-style";
      s.textContent = `
        .kart-touch{position:fixed;inset:0;z-index:12;pointer-events:none;}
        .kart-touch__stick{position:absolute;left:16px;bottom:max(16px,env(safe-area-inset-bottom));width:110px;height:110px;border-radius:50%;background:rgba(255,255,255,.25);pointer-events:auto;touch-action:none;}
        .kart-touch__stick span{position:absolute;left:50%;top:50%;width:48px;height:48px;margin:-24px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 4px 12px rgba(0,0,0,.15);}
        .kart-touch__right{position:absolute;right:16px;bottom:max(16px,env(safe-area-inset-bottom));display:grid;gap:8px;pointer-events:auto;}
        .kart-touch__btn{padding:.55rem .8rem;border:none;border-radius:12px;font-weight:700;background:rgba(255,255,255,.9);box-shadow:0 4px 12px rgba(0,0,0,.12);}
        .kart-touch__btn--drift{background:linear-gradient(90deg,#fbbf24,#f97316);color:#fff;}
        .kart-touch__btn.is-down{transform:scale(.96);opacity:.85;}
      `;
      document.head.appendChild(s);
    }

    const stick = this.touchRoot.querySelector<HTMLElement>("[data-stick]")!;
    const knob = stick.querySelector<HTMLElement>("span")!;

    const resetStick = () => {
      this.stickId = null;
      this.touchSteer = 0;
      knob.style.transform = "translate(0,0)";
    };

    stick.addEventListener("touchstart", (e) => {
      const t = e.changedTouches[0];
      this.stickId = t.identifier;
      const r = stick.getBoundingClientRect();
      this.stickCenter = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      e.preventDefault();
    }, { passive: false });

    stick.addEventListener("touchmove", (e) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== this.stickId) continue;
        const dx = t.clientX - this.stickCenter.x;
        const dy = t.clientY - this.stickCenter.y;
        const max = 42;
        const len = Math.hypot(dx, dy) || 1;
        const cx = (dx / len) * Math.min(max, len);
        const cy = (dy / len) * Math.min(max, len);
        knob.style.transform = `translate(${cx}px,${cy}px)`;
        this.touchSteer = cx / max;
        this.touchThrottle = Math.max(0, -cy / max);
        this.touchBrake = Math.max(0, cy / max);
      }
      e.preventDefault();
    }, { passive: false });

    stick.addEventListener("touchend", resetStick);
    stick.addEventListener("touchcancel", resetStick);

    const bindBtn = (sel: string, on: () => void, off: () => void) => {
      const btn = this.touchRoot!.querySelector<HTMLButtonElement>(sel)!;
      const down = (e: Event) => { e.preventDefault(); btn.classList.add("is-down"); on(); };
      const up = () => { btn.classList.remove("is-down"); off(); };
      btn.addEventListener("touchstart", down, { passive: false });
      btn.addEventListener("touchend", up);
      btn.addEventListener("touchcancel", up);
    };

    bindBtn("[data-throttle]", () => { this.touchThrottle = 1; }, () => { this.touchThrottle = 0; });
    bindBtn("[data-brake]", () => { this.touchBrake = 1; }, () => { this.touchBrake = 0; });
    bindBtn("[data-drift]", () => { this.touchHandbrake = true; }, () => { this.touchHandbrake = false; });
  }

  setTouchVisible(on: boolean): void {
    if (this.touchRoot) this.touchRoot.style.display = on ? "" : "none";
  }
}
