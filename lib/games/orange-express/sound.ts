import { noiseBuffer } from "@/lib/gamekit/runtime/synth";
import type { BrakeNotch, PowerNotch } from "@/lib/games/orange-express/types";

/**
 * 駕駛中持續的聲音：馬達低鳴、加速時的高音、煞車嘶聲、隧道轟聲。
 * 全部即時合成，接在 music 分軌（跟店內環境音同一條），跟著抬頭音效一起靜音。
 * 每一層音量都壓在 0.14 以下，再乘分軌音量。
 */

export type DriveMix = {
  humFreq: number;
  humVol: number;
  whineFreq: number;
  whineVol: number;
  hissVol: number;
  /** 隧道裡的低沉轟聲。 */
  rumbleVol: number;
};

export const MIX_CEILING = 0.14;
/** 這一站的 0–1 走多少就壓過一次接縫。 */
export const JOINT_SPACING = 0.05;

export function driveMix(
  speed: number,
  power: PowerNotch,
  brake: BrakeNotch,
  tunnel = false,
): DriveMix {
  const s = Math.min(1, Math.max(0, Number.isFinite(speed) ? speed : 0));
  const moving = s > 0.005;
  const traction = brake === 0 && power > 0;
  const humVol = moving || traction ? Math.min(0.08, 0.025 + s * 0.05 + (traction ? 0.008 : 0)) : 0;
  const whineVol = traction ? Math.min(0.04, 0.01 + power * 0.004 + s * 0.012) : moving ? s * 0.006 : 0;
  let hissVol = 0;
  if (brake > 0 && moving) hissVol = Math.min(0.07, 0.014 + brake * 0.008 + s * 0.02);
  return {
    humFreq: Math.round(55 + s * 180),
    humVol: round(humVol),
    whineFreq: Math.round(380 + s * 1100),
    whineVol: round(whineVol),
    hissVol: round(hissVol),
    rumbleVol: tunnel ? round(Math.min(0.11, 0.03 + s * 0.09)) : 0,
  };
}

function round(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** 從 prev 走到 next（同一站的進度）壓過幾個接縫。倒車也算。 */
export function jointsCrossed(prev: number, next: number, spacing = JOINT_SPACING): number {
  if (!Number.isFinite(prev) || !Number.isFinite(next) || spacing <= 0) return 0;
  return Math.abs(Math.floor(next / spacing) - Math.floor(prev / spacing));
}

type Layer = { gain: GainNode; src: AudioScheduledSourceNode };

export class DriveSound {
  private out: GainNode | null = null;
  private hum: (Layer & { osc: OscillatorNode; sub: OscillatorNode }) | null = null;
  private whine: (Layer & { osc: OscillatorNode }) | null = null;
  private hiss: Layer | null = null;
  private rumble: Layer | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly dest: AudioNode,
  ) {}

  get running(): boolean {
    return this.out !== null;
  }

  start(): void {
    if (this.out) return;
    const { ctx } = this;
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now);
    out.gain.exponentialRampToValueAtTime(1, now + 0.3);
    out.connect(this.dest);
    this.out = out;

    const humGain = ctx.createGain();
    humGain.gain.value = 0;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 520;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 55;
    const sub = ctx.createOscillator();
    sub.type = "triangle";
    sub.frequency.value = 110;
    osc.connect(lowpass);
    sub.connect(lowpass);
    lowpass.connect(humGain);
    humGain.connect(out);
    osc.start(now);
    sub.start(now);
    this.hum = { gain: humGain, src: osc, osc, sub };

    const whineGain = ctx.createGain();
    whineGain.gain.value = 0;
    const whineOsc = ctx.createOscillator();
    whineOsc.type = "sine";
    whineOsc.frequency.value = 380;
    whineOsc.connect(whineGain);
    whineGain.connect(out);
    whineOsc.start(now);
    this.whine = { gain: whineGain, src: whineOsc, osc: whineOsc };

    const hissGain = ctx.createGain();
    hissGain.gain.value = 0;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 3200;
    band.Q.value = 0.8;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    noise.loop = true;
    noise.connect(band);
    band.connect(hissGain);
    hissGain.connect(out);
    noise.start(now, Math.random() * 0.5);
    this.hiss = { gain: hissGain, src: noise };

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0;
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = 170;
    const rumbleNoise = ctx.createBufferSource();
    rumbleNoise.buffer = noiseBuffer(ctx);
    rumbleNoise.loop = true;
    rumbleNoise.connect(low);
    low.connect(rumbleGain);
    rumbleGain.connect(out);
    rumbleNoise.start(now, Math.random() * 0.5);
    this.rumble = { gain: rumbleGain, src: rumbleNoise };
  }

  update(mix: DriveMix): void {
    if (!this.out) return;
    const now = this.ctx.currentTime;
    const ease = 0.08;
    try {
      if (this.hum) {
        this.hum.osc.frequency.setTargetAtTime(mix.humFreq, now, ease);
        this.hum.sub.frequency.setTargetAtTime(mix.humFreq * 2, now, ease);
        this.hum.gain.gain.setTargetAtTime(Math.min(MIX_CEILING, mix.humVol), now, ease);
      }
      if (this.whine) {
        this.whine.osc.frequency.setTargetAtTime(mix.whineFreq, now, ease);
        this.whine.gain.gain.setTargetAtTime(Math.min(MIX_CEILING, mix.whineVol), now, ease);
      }
      if (this.hiss) this.hiss.gain.gain.setTargetAtTime(Math.min(MIX_CEILING, mix.hissVol), now, 0.05);
      if (this.rumble) this.rumble.gain.gain.setTargetAtTime(Math.min(MIX_CEILING, mix.rumbleVol), now, 0.25);
    } catch {
      // 參數排程失敗時這一幀沒有變化，下一幀再試
    }
  }

  stop(): void {
    const out = this.out;
    if (!out) return;
    this.out = null;
    const now = this.ctx.currentTime;
    const sources: AudioScheduledSourceNode[] = [];
    if (this.hum) sources.push(this.hum.osc, this.hum.sub);
    if (this.whine) sources.push(this.whine.osc);
    if (this.hiss) sources.push(this.hiss.src);
    if (this.rumble) sources.push(this.rumble.src);
    this.rumble = null;
    this.hum = null;
    this.whine = null;
    this.hiss = null;
    try {
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), now);
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    } catch {
      // 淡出失敗就直接停
    }
    for (const src of sources) {
      try {
        src.stop(now + 0.3);
      } catch {
        // 已停止
      }
    }
    setTimeout(() => {
      try {
        out.disconnect();
      } catch {
        // 已拔掉
      }
    }, 400);
  }
}
