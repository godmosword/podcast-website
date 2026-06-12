import type { GameKitGameId } from "./types";

/** 0 = 休止符；其餘為 Hz 頻率。 */
export type BgmStep = number;

export type BgmTheme = {
  bpm: number;
  stepsPerBeat: number;
  melodyWave: OscillatorType;
  bassWave: OscillatorType;
  melody: BgmStep[][];
  bass: BgmStep[][];
  melodyVol: number;
  bassVol: number;
};

const C3 = 131;
const D3 = 147;
const E3 = 165;
const G3 = 196;
const A3 = 220;
const B3 = 247;
const C4 = 262;
const D4 = 294;
const E4 = 330;
const G4 = 392;
const A4 = 440;
const B4 = 494;
const C5 = 523;
const D5 = 587;
const E5 = 659;
const G5 = 784;
const A5 = 880;
const R = 0;

/** Game Kit 遊戲的程序生成 chiptune 主題（Phase 3 佔位，日後可換 BeepBox 匯出）。 */
export const BGM_THEMES: Record<GameKitGameId, BgmTheme> = {
  "car-adventure": {
    bpm: 108,
    stepsPerBeat: 4,
    melodyWave: "square",
    bassWave: "triangle",
    melodyVol: 0.085,
    bassVol: 0.065,
    melody: [
      [E5, R, G5, E5, C5, R, D5, E5, G5, R, A5, G5, E5, D5, C5, R],
      [G5, R, A5, G5, E5, R, D5, E5, C5, R, D5, E5, G5, E5, D5, R],
    ],
    bass: [
      [C3, R, C3, G3, C3, R, G3, C3, A3, R, A3, E3, A3, R, E3, A3],
      [G3, R, G3, D3, G3, R, D3, G3, E3, R, E3, B3, E3, R, B3, E3],
    ],
  },
  "block-drop": {
    bpm: 120,
    stepsPerBeat: 4,
    melodyWave: "square",
    bassWave: "square",
    melodyVol: 0.075,
    bassVol: 0.055,
    melody: [
      [E5, B4, C5, D5, C5, B4, A4, A4, C5, E5, D5, C5, B4, B4, C5, D5],
      [E5, C5, E5, G5, E5, C5, D5, E5, G5, E5, D5, C5, B4, A4, B4, C5],
    ],
    bass: [
      [E3, E3, C3, C3, G3, G3, A3, A3, E3, E3, C3, C3, G3, G3, A3, A3],
      [C3, C3, G3, G3, E3, E3, A3, A3, D3, D3, A3, A3, E3, E3, B3, B3],
    ],
  },
  // candy-kart BGM 由 Godot 端播放；此主題僅供型別完整與大廳預覽
  "candy-kart": {
    bpm: 132,
    stepsPerBeat: 4,
    melodyWave: "square",
    bassWave: "triangle",
    melodyVol: 0.08,
    bassVol: 0.06,
    melody: [
      [C5, E5, G5, E5, A5, G5, E5, C5, D5, E5, D5, C5, B4, C5, D5, R],
      [E5, G5, A5, G5, C5, D5, E5, G5, A5, G5, E5, D5, C5, R, G4, C5],
    ],
    bass: [
      [C3, R, G3, C3, A3, R, E3, A3, D3, R, A3, D3, G3, R, D3, G3],
      [C3, C3, G3, G3, A3, A3, E3, E3, D3, D3, G3, G3, C3, R, C3, R],
    ],
  },
};

export function validateBgmTheme(theme: BgmTheme): boolean {
  if (theme.bpm <= 0 || theme.stepsPerBeat <= 0) return false;
  if (theme.melody.length === 0 || theme.bass.length === 0) return false;
  const len = theme.melody[0].length;
  if (len === 0) return false;
  for (const row of [...theme.melody, ...theme.bass]) {
    if (row.length !== len) return false;
    for (const step of row) {
      if (step < 0) return false;
    }
  }
  return true;
}

/**
 * WebAudio 程序生成 chiptune 循環播放器。
 * 連至 music bus（GainNode），由 useGameAudio 管理生命週期。
 */
export class ChiptuneBgmPlayer {
  private theme: BgmTheme | null = null;
  private step = 0;
  private running = false;
  private paused = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly ctx: AudioContext,
    private readonly musicBus: GainNode,
  ) {}

  get isPlaying(): boolean {
    return this.running && !this.paused;
  }

  play(gameId: GameKitGameId): void {
    const theme = BGM_THEMES[gameId];
    if (!validateBgmTheme(theme)) return;
    this.stop();
    this.theme = theme;
    this.step = 0;
    this.running = true;
    this.paused = false;
    this.scheduleStep();
  }

  pause(): void {
    if (!this.running) return;
    this.paused = true;
    this.clearTimer();
  }

  resume(): void {
    if (!this.running || !this.paused || !this.theme) return;
    this.paused = false;
    this.scheduleStep();
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.theme = null;
    this.step = 0;
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleStep(): void {
    if (!this.running || this.paused || !this.theme) return;

    const theme = this.theme;
    const rowLen = theme.melody[0].length;
    const melRow = theme.melody[Math.floor(this.step / rowLen) % theme.melody.length];
    const bassRow = theme.bass[Math.floor(this.step / rowLen) % theme.bass.length];
    const col = this.step % rowLen;

    const mel = melRow[col];
    const bass = bassRow[col];
    const stepSec = 60 / theme.bpm / theme.stepsPerBeat;

    if (mel > 0) {
      this.playTone(mel, stepSec * 0.88, theme.melodyWave, theme.melodyVol);
    }
    if (bass > 0) {
      this.playTone(bass, stepSec * 0.92, theme.bassWave, theme.bassVol);
    }

    this.step += 1;
    this.timer = setTimeout(() => this.scheduleStep(), stepSec * 1000);
  }

  private playTone(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
  ): void {
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(Math.max(0.0001, vol), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(this.musicBus);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch {
      // 略過
    }
  }
}
