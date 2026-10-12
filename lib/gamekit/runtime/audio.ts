import { ChiptuneBgmPlayer } from "./chiptune-bgm";
import type { GameKitGameId } from "../types";

/**
 * 音訊模組（Phase 3）。
 *
 * 遊戲元件使用 `hooks/useGameAudio.ts`（WebAudio SFX + chiptune BGM）。
 * 場景／外框可用 `GameKitAudioBus` 共用同一混音拓撲。
 */

/**
 * 一個合成音色（宣告式）：振盪器或白噪音 → 可選濾波 → 快起慢落包絡 → sfx 分軌。
 * 用來做 tone() 做不到的質感音：啵（滑音）、咚（低通噪音）、沙沙（帶通噪音）、叮（高頻正弦疊泛音）。
 * 時間都以 AudioContext 時鐘排程，比 setTimeout 準，整組聲音不會被主執行緒卡頓拆散。
 */
export type SynthVoice = {
  wave: OscillatorType | "noise";
  /** 起始頻率（Hz）；noise 不用。 */
  freq?: number;
  /** 結束頻率：在 glide 秒內指數滑到這裡（啵、咻、問號音）。 */
  freqEnd?: number;
  /** 滑音秒數，預設整段 dur。 */
  glide?: number;
  /** 相對這組聲音起點的延遲（秒）。 */
  at?: number;
  /** 長度（秒），含收尾。 */
  dur: number;
  /** 峰值音量（0–1，會再乘 sfx 分軌音量）。 */
  vol: number;
  /** 起音秒數，預設 5ms；拉長就是柔和的淡入。 */
  attack?: number;
  filter?: { type: BiquadFilterType; freq: number; freqEnd?: number; q?: number };
};

/** 一次最多排這麼多個音色，避免連點時堆出上百個節點。 */
export const MAX_VOICES_PER_CALL = 16;

export type AudioBusConfig = {
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
};

const DEFAULT_MUSIC_VOLUME = 0.28;
const DEFAULT_SFX_VOLUME = 0.85;

export type AudioBusNodes = {
  master: GainNode;
  music: GainNode;
  sfx: GainNode;
};

/** 建立 master → music／sfx 分軌拓撲。 */
function createAudioBus(ctx: AudioContext): AudioBusNodes {
  const master = ctx.createGain();
  master.gain.value = 1;

  const music = ctx.createGain();
  music.gain.value = DEFAULT_MUSIC_VOLUME;

  const sfx = ctx.createGain();
  sfx.gain.value = DEFAULT_SFX_VOLUME;

  music.connect(master);
  sfx.connect(master);
  master.connect(ctx.destination);

  return { master, music, sfx };
}

export class GameKitAudioBus {
  private ctx: AudioContext | null = null;
  private nodes: AudioBusNodes | null = null;
  private bgm: ChiptuneBgmPlayer | null = null;
  private noise: AudioBuffer | null = null;
  private activeGame: GameKitGameId | null = null;

  private config: AudioBusConfig = {
    musicVolume: DEFAULT_MUSIC_VOLUME,
    sfxVolume: DEFAULT_SFX_VOLUME,
    muted: false,
  };

  get volume(): AudioBusConfig {
    return { ...this.config };
  }

  get context(): AudioContext | null {
    return this.ctx;
  }

  get sfxBus(): GainNode | null {
    return this.nodes?.sfx ?? null;
  }

  ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        const W = window as Window & { webkitAudioContext?: typeof AudioContext };
        const Ctor = window.AudioContext ?? W.webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
        this.nodes = createAudioBus(this.ctx);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private applyVolumes(): void {
    if (!this.nodes) return;
    const on = !this.config.muted;
    this.nodes.music.gain.value = on ? this.config.musicVolume : 0;
    this.nodes.sfx.gain.value = on ? this.config.sfxVolume : 0;
  }

  setMusicVolume(v: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  setSfxVolume(v: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, v));
    this.applyVolumes();
  }

  setMuted(muted: boolean): void {
    this.config.muted = muted;
    this.applyVolumes();
    if (muted) {
      this.bgm?.stop();
    } else if (this.activeGame) {
      this.playBgm(this.activeGame);
    }
  }

  playTone(
    freq: number,
    dur: number,
    type: OscillatorType = "square",
    vol = 0.05,
  ): void {
    const ctx = this.ensureContext();
    const bus = this.nodes?.sfx;
    if (!ctx || !bus || this.config.muted) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(Math.max(0.0001, vol), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(bus);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      // 略過
    }
  }

  /** 播一組合成音色（同一個時間起點）；靜音、無 WebAudio 時 no-op。 */
  playVoices(voices: readonly SynthVoice[]): void {
    const ctx = this.ensureContext();
    const bus = this.nodes?.sfx;
    if (!ctx || !bus || this.config.muted) return;
    const start = ctx.currentTime + 0.005;
    for (const v of voices.slice(0, MAX_VOICES_PER_CALL)) {
      try {
        this.playVoice(ctx, bus, v, start + Math.max(0, v.at ?? 0));
      } catch {
        // 單一音色失敗不影響其他
      }
    }
  }

  /** 1 秒白噪音，建一次重複用（每次從隨機位置開始播，聽起來不會一樣）。 */
  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise && this.noise.sampleRate === ctx.sampleRate) return this.noise;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.noise = buf;
    return buf;
  }

  private playVoice(ctx: AudioContext, bus: GainNode, v: SynthVoice, start: number): void {
    const dur = Math.max(0.02, v.dur);
    const attack = Math.min(Math.max(0.002, v.attack ?? 0.005), dur / 2);
    let src: AudioScheduledSourceNode;
    let begin: () => void;
    if (v.wave === "noise") {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer(ctx);
      n.loop = true;
      begin = () => n.start(start, Math.random() * 0.5);
      src = n;
    } else {
      const osc = ctx.createOscillator();
      osc.type = v.wave;
      const f0 = Math.max(20, v.freq ?? 440);
      osc.frequency.setValueAtTime(f0, start);
      if (v.freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, v.freqEnd), start + Math.min(dur, v.glide ?? dur));
      begin = () => osc.start(start);
      src = osc;
    }
    let out: AudioNode = src;
    if (v.filter) {
      const f = ctx.createBiquadFilter();
      f.type = v.filter.type;
      f.frequency.setValueAtTime(v.filter.freq, start);
      if (v.filter.freqEnd) f.frequency.exponentialRampToValueAtTime(v.filter.freqEnd, start + dur);
      f.Q.value = v.filter.q ?? 1;
      out.connect(f);
      out = f;
    }
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, Math.min(1, v.vol)), start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    out.connect(gain);
    gain.connect(bus);
    begin();
    src.stop(start + dur + 0.03);
  }

  playBgm(gameId: GameKitGameId): void {
    const ctx = this.ensureContext();
    const music = this.nodes?.music;
    if (!ctx || !music || this.config.muted) return;
    this.activeGame = gameId;
    if (!this.bgm) this.bgm = new ChiptuneBgmPlayer(ctx, music);
    this.bgm.play(gameId);
  }

  pauseBgm(): void {
    this.bgm?.pause();
  }

  resumeBgm(): void {
    if (this.config.muted) return;
    this.bgm?.resume();
  }

  stopBgm(): void {
    this.activeGame = null;
    this.bgm?.stop();
  }
}
