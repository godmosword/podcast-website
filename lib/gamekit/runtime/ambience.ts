import type { GameKitGameId } from "../types";
import { noiseBuffer, scheduleVoice, type SynthVoice } from "./synth";

/**
 * 店內環境音：跟背景音樂同一條 music 分軌（跟著靜音、遊戲音量），由 GameKitAudioBus 與 BGM 一起開關／暫停。
 * 兩層：持續的底噪（濾波白噪音，LFO 讓它慢慢起伏）＋隨機間隔冒出來的小事件（每次挑一種變化，不會像循環錄音）。
 * 全部即時合成，零音檔。
 */

export type AmbienceBed = {
  filter: { type: BiquadFilterType; freq: number; q?: number };
  /** 底噪音量（再乘 music 分軌）。 */
  vol: number;
  /** 慢慢起伏：rate（Hz）、depth（vol 的比例，0–1）。 */
  lfo?: { rate: number; depth: number };
};

export type AmbienceEvent = {
  /** 每次之後再隔多久（秒），在 [min, max] 之間隨機。 */
  every: readonly [min: number, max: number];
  /** 第一次出現前的延遲（秒）；省略則同 every。 */
  first?: readonly [min: number, max: number];
  /** 每次隨機挑一組播。 */
  variants: readonly (readonly SynthVoice[])[];
};

export type AmbienceTheme = {
  beds: readonly AmbienceBed[];
  events: readonly AmbienceEvent[];
  /** 開始／繼續時淡入秒數。 */
  fadeIn: number;
};

/** 遠處的小鈴：正弦＋鐘的不和諧泛音，低通讓它聽起來在店的另一頭。 */
function distantBell(freq: number, at: number, vol: number): SynthVoice[] {
  return [
    { wave: "sine", freq, at, dur: 1.1, vol, attack: 0.004 },
    { wave: "sine", freq: freq * 2.76, at, dur: 0.45, vol: vol * 0.25, attack: 0.004, filter: { type: "lowpass", freq: 3200 } },
  ];
}

/** 遠處的瓷盤輕碰一下。 */
function clink(at: number, base: number, vol: number): SynthVoice[] {
  return [
    { wave: "sine", freq: base, at, dur: 0.2, vol, attack: 0.002 },
    { wave: "sine", freq: base * 1.49, at, dur: 0.12, vol: vol * 0.6, attack: 0.002 },
  ];
}

/** 迴轉帶接縫輕輕「喀」一下。 */
function clack(at: number, vol: number): SynthVoice[] {
  return [
    { wave: "noise", at, dur: 0.045, vol, filter: { type: "bandpass", freq: 1250, q: 2.2 } },
    { wave: "sine", freq: 170, freqEnd: 130, at, dur: 0.06, vol: vol * 0.6 },
  ];
}

/**
 * 迴轉壽司店：迴轉帶低低的運轉聲＋店裡的空氣聲當底；
 * 帶子接縫偶爾輕輕喀喀、遠處瓷盤或筷子碰一下、很久一次門口「叮咚」有客人進來。
 * 音量刻意壓在背景音樂底下，聽得出是在店裡，但不搶多多的反應音。
 */
const KAITEN_SHOP: AmbienceTheme = {
  fadeIn: 1.2,
  beds: [
    // 迴轉帶運轉的低鳴（380Hz 以下，手機喇叭也聽得到一點）
    { filter: { type: "lowpass", freq: 380, q: 0.7 }, vol: 0.055, lfo: { rate: 0.13, depth: 0.25 } },
    // 店裡的空氣聲（像遠遠的冷氣與人聲糊成一片）
    { filter: { type: "bandpass", freq: 900, q: 0.6 }, vol: 0.012, lfo: { rate: 0.07, depth: 0.4 } },
  ],
  events: [
    {
      every: [1.6, 3.2],
      first: [0.8, 1.6],
      variants: [clack(0, 0.045), [...clack(0, 0.04), ...clack(0.12, 0.03)], clack(0, 0.03)],
    },
    {
      every: [7, 14],
      first: [3, 6],
      variants: [
        clink(0, 2550, 0.022),
        [...clink(0, 2480, 0.02), ...clink(0.17, 2620, 0.016)],
        // 筷子輕敲碗邊
        [
          { wave: "sine", freq: 1420, freqEnd: 1320, dur: 0.035, vol: 0.022 },
          { wave: "sine", freq: 1460, freqEnd: 1360, at: 0.1, dur: 0.035, vol: 0.018 },
        ],
      ],
    },
    {
      every: [45, 75],
      first: [20, 32],
      // 門口「叮咚」：比開始時那聲歡迎光臨小聲、遠很多
      variants: [[...distantBell(1318.5, 0, 0.018), ...distantBell(1046.5, 0.3, 0.018)]],
    },
  ],
};

export const AMBIENCE_THEMES: Partial<Record<GameKitGameId, AmbienceTheme>> = {
  "dino-sushi": KAITEN_SHOP,
};

/** 一個遊戲的環境音播放器（接在 music 分軌）；play 對同一主題是冪等的，重複呼叫不會重來。 */
export class AmbiencePlayer {
  private theme: AmbienceTheme | null = null;
  private running = false;
  private paused = false;
  private out: GainNode | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private readonly ctx: AudioContext,
    private readonly musicBus: AudioNode,
    private readonly rand: () => number = Math.random,
  ) {}

  get isPlaying(): boolean {
    return this.running && !this.paused;
  }

  play(gameId: GameKitGameId): void {
    const theme = AMBIENCE_THEMES[gameId] ?? null;
    if (theme && theme === this.theme && this.isPlaying) return;
    this.stop();
    if (!theme) return;
    this.theme = theme;
    this.running = true;
    this.paused = false;
    this.begin(theme);
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.halt();
  }

  resume(): void {
    if (!this.running || !this.paused || !this.theme) return;
    this.paused = false;
    this.begin(this.theme);
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.theme = null;
    this.halt();
  }

  private begin(theme: AmbienceTheme): void {
    try {
      const { ctx } = this;
      const now = ctx.currentTime;
      const out = ctx.createGain();
      out.gain.setValueAtTime(0.0001, now);
      out.gain.exponentialRampToValueAtTime(1, now + Math.max(0.05, theme.fadeIn));
      out.connect(this.musicBus);
      this.out = out;
      for (const bed of theme.beds) this.startBed(bed, out, now);
      theme.events.forEach((ev, i) => this.arm(i, ev.first ?? ev.every));
    } catch {
      // 環境音失敗不影響遊戲
    }
  }

  private startBed(bed: AmbienceBed, out: AudioNode, now: number): void {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = bed.filter.type;
    filter.frequency.value = bed.filter.freq;
    filter.Q.value = bed.filter.q ?? 1;
    const gain = ctx.createGain();
    gain.gain.value = bed.vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(now, this.rand() * 0.5);
    this.sources.push(src);
    if (bed.lfo) {
      const lfo = ctx.createOscillator();
      lfo.type = "sine";
      lfo.frequency.value = bed.lfo.rate;
      const depth = ctx.createGain();
      depth.gain.value = bed.vol * bed.lfo.depth;
      lfo.connect(depth);
      depth.connect(gain.gain);
      lfo.start(now);
      this.sources.push(lfo);
    }
  }

  /** 排第 i 種事件的下一次。 */
  private arm(i: number, [min, max]: readonly [number, number]): void {
    const delay = min + this.rand() * (max - min);
    const id = setTimeout(() => {
      this.timers.delete(id);
      const theme = this.theme;
      const out = this.out;
      if (!this.isPlaying || !theme || !out) return;
      const ev = theme.events[i]!;
      // iOS 來電、Siri 等讓 AudioContext 暫停時時間不走：先跳過這次，免得恢復時一次全部響出來
      if (this.ctx.state !== "running") {
        this.arm(i, ev.every);
        return;
      }
      const variant = ev.variants[Math.min(ev.variants.length - 1, Math.floor(this.rand() * ev.variants.length))]!;
      const start = this.ctx.currentTime + 0.02;
      for (const v of variant) {
        try {
          scheduleVoice(this.ctx, out, v, start + Math.max(0, v.at ?? 0));
        } catch {
          // 單一音色失敗不影響其他
        }
      }
      this.arm(i, ev.every);
    }, delay * 1000);
    this.timers.add(id);
  }

  /** 停掉底噪與排程，淡出 0.25 秒（不留尾巴、不爆音）。 */
  private halt(): void {
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    const out = this.out;
    this.out = null;
    const sources = this.sources;
    this.sources = [];
    if (!out) return;
    const now = this.ctx.currentTime;
    try {
      const gain = out.gain as AudioParam & { cancelAndHoldAtTime?: (t: number) => AudioParam };
      if (typeof gain.cancelAndHoldAtTime === "function") {
        // 淡入途中被停：從當下的音量往下淡，不會先跳回滿音量
        gain.cancelAndHoldAtTime(now);
      } else {
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(Math.max(0.0001, gain.value), now);
      }
      gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
    } catch {
      // 淡出失敗就直接停
    }
    for (const s of sources) {
      try {
        s.stop(now + 0.3);
      } catch {
        // 已停止的節點再 stop 會丟錯，略過
      }
    }
    // 淡出完把這一輪的節點從 music 分軌拔掉，暫停／繼續很多次也不會越積越多
    setTimeout(() => {
      try {
        out.disconnect();
      } catch {
        // 已拔掉
      }
    }, 400);
  }
}
