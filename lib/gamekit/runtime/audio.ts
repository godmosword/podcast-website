import { AmbiencePlayer } from "./ambience";
import { ChiptuneBgmPlayer } from "./chiptune-bgm";
import { scheduleVoice, type SynthVoice } from "./synth";
import type { GameKitGameId } from "../types";

/**
 * 音訊模組（Phase 3）。
 *
 * 遊戲元件使用 `hooks/useGameAudio.ts`（WebAudio SFX + chiptune BGM＋店內環境音）。
 * 場景／外框可用 `GameKitAudioBus` 共用同一混音拓撲。
 */

export type { SynthVoice } from "./synth";

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
  private ambience: AmbiencePlayer | null = null;
  /** 遊戲暫停中：重新開聲音時不要在暫停畫面底下把音樂與環境音開回來。 */
  private bgmPaused = false;
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
    // iOS 來電／Siri 會進 interrupted，不只 suspended。closed 不能 resume。
    if (this.ctx.state !== "running" && this.ctx.state !== "closed") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** 關掉這個 bus 自己的 AudioContext。每個 useGameAudio 各有一個 bus，不共用。 */
  dispose(): void {
    this.stopBgm();
    const ctx = this.ctx;
    this.ctx = null;
    this.nodes = null;
    this.bgm = null;
    this.ambience = null;
    if (ctx && ctx.state !== "closed") {
      void ctx.close();
    }
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

  /**
   * 只有靜音狀態真的改變時才停／重開背景音樂與環境音。
   * ensureAudio() 每次點擊都會帶目前狀態呼叫這裡；以前沒判斷，遊戲中每選一次飯 BGM 就從頭重播。
   */
  setMuted(muted: boolean): void {
    const changed = muted !== this.config.muted;
    this.config.muted = muted;
    this.applyVolumes();
    if (!changed) return;
    if (muted) {
      this.bgm?.stop();
      this.ambience?.stop();
    } else if (this.activeGame && !this.bgmPaused) {
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
        scheduleVoice(ctx, bus, v, start + Math.max(0, v.at ?? 0));
      } catch {
        // 單一音色失敗不影響其他
      }
    }
  }

  playBgm(gameId: GameKitGameId): void {
    const ctx = this.ensureContext();
    const music = this.nodes?.music;
    if (!ctx || !music || this.config.muted) return;
    this.activeGame = gameId;
    this.bgmPaused = false;
    if (!this.bgm) this.bgm = new ChiptuneBgmPlayer(ctx, music);
    this.bgm.play(gameId);
    // 有店內環境音的遊戲（壽司屋）跟 BGM 一起開；沒有的遊戲 play 只會確保停掉
    if (!this.ambience) this.ambience = new AmbiencePlayer(ctx, music);
    this.ambience.play(gameId);
  }

  pauseBgm(): void {
    this.bgmPaused = true;
    this.bgm?.pause();
    this.ambience?.pause();
  }

  resumeBgm(): void {
    if (this.config.muted) return;
    this.bgmPaused = false;
    this.bgm?.resume();
    this.ambience?.resume();
  }

  stopBgm(): void {
    this.activeGame = null;
    this.bgmPaused = false;
    this.bgm?.stop();
    this.ambience?.stop();
  }
}
