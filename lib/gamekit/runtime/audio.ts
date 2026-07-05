import { ChiptuneBgmPlayer } from "./chiptune-bgm";
import type { GameKitGameId } from "../types";

/**
 * 音訊模組（Phase 3）。
 *
 * 遊戲元件使用 `hooks/useGameAudio.ts`（WebAudio SFX + chiptune BGM）。
 * 場景／外框可用 `GameKitAudioBus` 共用同一混音拓撲。
 */

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
