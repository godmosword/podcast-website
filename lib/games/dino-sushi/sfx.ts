/**
 * 《多多壽司屋》音效：全部用 WebAudio 即時合成（零音檔、零下載），純資料。
 * 每個動作一種「材質」，孩子不看畫面也聽得出發生什麼事：
 * 飯放上砧板＝木頭「咚」、加料＝往上跳的「啵」（第幾層越高音）、拿掉＝往下的「咻」、
 * 送出＝店裡的叫人鈴＋迴轉帶滑過去、多多吃＝「啊姆」＋嚼嚼、疊盤＝瓷盤「叮」、金盤多一點閃光。
 * 音量刻意小、沒有錯誤音（料位滿了擠掉最舊那層、缺料都不罵人）；缺料只是多多疑問的「嗯？」。
 */

import type { SynthVoice } from "@/lib/gamekit/runtime/audio";
import type { Mood } from "./reactions";

type Voices = readonly SynthVoice[];

/** 音名（Hz）：C 大調五聲，聽起來像日式祭典的小鈴鐺。 */
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;
const G6 = 1568;
const C7 = 2093;

/** 木琴／馬林巴：基音＋很快消失的高泛音，比純三角波有「敲到木頭」的質感。 */
function mallet(freq: number, at: number, vol = 0.09, dur = 0.32): SynthVoice[] {
  return [
    { wave: "sine", freq, at, dur, vol },
    { wave: "sine", freq: freq * 4, at, dur: 0.05, vol: vol * 0.28 },
  ];
}

/** 泛音不超過這個頻率：再高對小朋友的耳朵太刺。 */
const MAX_PARTIAL_HZ = 6000;

/** 小鈴鐺：正弦＋不和諧泛音（鐘的金屬感），尾巴長。 */
function bell(freq: number, at: number, vol = 0.06, dur = 0.9): SynthVoice[] {
  const partials: SynthVoice[] = [
    { wave: "sine", freq, at, dur, vol, attack: 0.003 },
    { wave: "sine", freq: freq * 2.76, at, dur: dur * 0.45, vol: vol * 0.32, attack: 0.003 },
    { wave: "sine", freq: freq * 5.4, at, dur: dur * 0.18, vol: vol * 0.14, attack: 0.002 },
  ];
  return partials.filter((p) => (p.freq ?? 0) <= MAX_PARTIAL_HZ);
}

/** 一點亮晶晶（三顆很高的小鈴）。 */
function sparkle(at: number, vol = 0.03): SynthVoice[] {
  return [C7, 2637, 3136].map((freq, i) => ({ wave: "sine", freq, at: at + i * 0.07, dur: 0.28, vol, attack: 0.002 }));
}

/** 嚼一口：短促的低通噪音＋一點點低音。 */
function munch(at: number): SynthVoice[] {
  return [
    { wave: "noise", at, dur: 0.07, vol: 0.13, filter: { type: "bandpass", freq: 900, q: 1.4 } },
    { wave: "sine", freq: 210, freqEnd: 150, at, dur: 0.07, vol: 0.06 },
  ];
}

/** 第幾層料的啵：1／2／3 層依序 Do、Mi、Sol 往上，放滿三層像唱完一句。 */
const LAYER_POP = [C5, E5, G5] as const;

export const SUSHI_SFX = {
  /** 標題按開始：店門口的「叮咚」（歡迎光臨）。 */
  welcome: [...bell(E6, 0, 0.06, 0.6), ...bell(C6, 0.26, 0.06, 0.9)],
  /** 飯放上砧板：木頭「咚」。 */
  base: [
    { wave: "sine", freq: 760, freqEnd: 600, dur: 0.07, vol: 0.09 },
    { wave: "noise", dur: 0.03, vol: 0.1, filter: { type: "bandpass", freq: 1800, q: 3 } },
    { wave: "sine", freq: 190, freqEnd: 120, dur: 0.13, vol: 0.1 },
  ],
  /** 點壽司重選飯：輕輕的「嗒」。 */
  tap: [{ wave: "sine", freq: 980, freqEnd: 900, dur: 0.05, vol: 0.05 }],
  /** 料位滿了，最舊那層被新料擠出去、飛回托盤：比「拿掉」更輕更短的「咻」，接著新料的「啵」。 */
  evict: [{ wave: "sine", freq: 620, freqEnd: 360, dur: 0.09, vol: 0.05, attack: 0.008 }],
  /** 拿掉一層料：往下滑的「咻」。 */
  remove: [
    { wave: "sine", freq: 820, freqEnd: 340, dur: 0.14, vol: 0.08, attack: 0.01 },
    { wave: "noise", dur: 0.1, vol: 0.035, filter: { type: "bandpass", freq: 1400, freqEnd: 700, q: 1.2 } },
  ],
  /** 按「給多多吃」：叫人鈴「叮」＋盤子放上迴轉帶「喀」＋滑過去「咻——」。 */
  serve: [
    ...bell(G6, 0, 0.055, 0.8),
    { wave: "noise", dur: 0.03, vol: 0.08, filter: { type: "lowpass", freq: 2200 } },
    { wave: "noise", at: 0.04, dur: 0.42, vol: 0.05, attack: 0.12, filter: { type: "bandpass", freq: 500, freqEnd: 1500, q: 1.1 } },
  ],
  /** 多多咬下去「啊姆」＋嚼三下（咀嚼期間播完，反應前收尾）。 */
  chomp: [
    { wave: "triangle", freq: 330, freqEnd: 196, dur: 0.12, vol: 0.06 },
    ...munch(0.1),
    ...munch(0.24),
    ...munch(0.38),
  ],
  /** 盤子疊上去：瓷盤「叮」。 */
  plate: [
    { wave: "sine", freq: 2380, dur: 0.22, vol: 0.035, attack: 0.002 },
    { wave: "sine", freq: 3710, dur: 0.12, vol: 0.022, attack: 0.002 },
    { wave: "noise", dur: 0.02, vol: 0.03, filter: { type: "highpass", freq: 5000 } },
  ],
  /** 新的一單：泡泡「啵啵」冒出來（跟疊盤同一刻發生，晚一拍讓瓷盤「叮」先響完）。 */
  order: [
    { wave: "sine", freq: 520, freqEnd: 860, at: 0.22, dur: 0.09, vol: 0.06, glide: 0.06 },
    { wave: "sine", freq: 700, freqEnd: 1120, at: 0.3, dur: 0.09, vol: 0.05, glide: 0.06 },
  ],
  /** 刷牙：唰唰唰唰＋牙齒亮晶晶。 */
  brush: [
    ...[0, 0.15, 0.3, 0.45].map(
      (at, i): SynthVoice => ({
        wave: "noise",
        at,
        dur: 0.1,
        vol: 0.05,
        attack: 0.02,
        filter: { type: "bandpass", freq: i % 2 ? 4600 : 3400, q: 0.9 },
      }),
    ),
    ...sparkle(0.66, 0.035),
  ],
  /** 一輪結束：小小的「噹噹噹——噹！」。 */
  fanfare: [
    ...mallet(C5, 0, 0.08),
    ...mallet(E5, 0.13, 0.08),
    ...mallet(G5, 0.26, 0.08),
    ...mallet(C6, 0.42, 0.09, 0.6),
    ...bell(C6, 0.42, 0.04, 1.2),
    ...sparkle(0.6, 0.025),
  ],
} satisfies Record<string, Voices>;

export type SushiSfxKey = keyof typeof SUSHI_SFX;

/** 多多的反應音：好吃＝木琴三連音、最愛＝再高一個 Do＋閃光、甜＝音樂盒、芥末＝排氣管噗＋嘻嘻笑、缺料＝疑問的「嗯？」。 */
export const MOOD_SFX: Readonly<Record<Mood, Voices>> = {
  yum: [...mallet(C5, 0), ...mallet(E5, 0.1), ...mallet(G5, 0.2, 0.09, 0.45)],
  love: [...mallet(C5, 0), ...mallet(E5, 0.09), ...mallet(G5, 0.18), ...mallet(C6, 0.27, 0.09, 0.55), ...sparkle(0.42)],
  sweet: [...bell(G6, 0, 0.04, 0.5), ...bell(E6, 0.14, 0.04, 0.5), ...bell(G6, 0.28, 0.04, 0.5), ...bell(C7, 0.42, 0.035, 0.8)],
  puff: [
    { wave: "noise", dur: 0.5, vol: 0.16, attack: 0.02, filter: { type: "lowpass", freq: 1600, freqEnd: 260, q: 0.8 } },
    { wave: "sine", freq: 140, freqEnd: 70, dur: 0.3, vol: 0.08 },
    ...[0.42, 0.54, 0.66].map(
      (at, i): SynthVoice => ({ wave: "triangle", freq: 640 + i * 50, freqEnd: 860 + i * 60, at, dur: 0.08, vol: 0.05, glide: 0.05 }),
    ),
  ],
  look: [
    { wave: "triangle", freq: 330, freqEnd: 494, dur: 0.32, vol: 0.07, attack: 0.04 },
    { wave: "sine", freq: 660, freqEnd: 988, dur: 0.26, vol: 0.02, attack: 0.04 },
  ],
};

/** 加第 layer 層料（1 起）。 */
export function addSfx(layer: number): Voices {
  const freq = LAYER_POP[Math.min(LAYER_POP.length, Math.max(1, layer)) - 1]!;
  return [
    { wave: "sine", freq: freq * 0.7, freqEnd: freq * 1.5, dur: 0.11, vol: 0.1, glide: 0.06 },
    { wave: "noise", dur: 0.02, vol: 0.04, filter: { type: "bandpass", freq: 3200, q: 2 } },
  ];
}

/** 疊盤；金邊盤（一次做對）多一串亮晶晶。 */
export function plateSfx(gold: boolean): Voices {
  return gold ? [...SUSHI_SFX.plate, ...sparkle(0.08, 0.028)] : SUSHI_SFX.plate;
}

/**
 * 同一個聲音每次音高差一點點（±3%），連做 5 單也不會像錄音機重播。
 * 只動頻率，長度與音量不變；rand 可注入，測試才能固定。
 */
export function varied(voices: Voices, rand: () => number = Math.random): Voices {
  const k = 1 + (rand() * 2 - 1) * 0.03;
  return voices.map((v) =>
    v.wave === "noise" ? v : { ...v, freq: (v.freq ?? 440) * k, ...(v.freqEnd ? { freqEnd: v.freqEnd * k } : {}) },
  );
}

/** 擠掉最舊那層時「啵」晚多久響（秒）：同時起播的話，輕的「咻」會被蓋掉。料落下的動畫 320ms，晚 80ms 仍對得上。 */
export const EVICT_POP_DELAY = 0.08;

/** 料位滿了再放料：先「咻」，「啵」整組往後挪 EVICT_POP_DELAY，合成一組送出起播時間才準。 */
export function evictThenPop(pop: Voices): Voices {
  return [...SUSHI_SFX.evict, ...pop.map((v) => ({ ...v, at: (v.at ?? 0) + EVICT_POP_DELAY }))];
}

/** 測試與音量預檢用：所有音效的清單。 */
export function allSushiSfx(): Record<string, Voices> {
  return {
    ...SUSHI_SFX,
    ...Object.fromEntries(Object.entries(MOOD_SFX).map(([k, v]) => [`mood-${k}`, v])),
    add1: addSfx(1),
    add2: addSfx(2),
    add3: addSfx(3),
    plateGold: plateSfx(true),
  };
}
