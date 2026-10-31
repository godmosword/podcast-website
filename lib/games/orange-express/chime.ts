import type { SynthVoice } from "@/lib/gamekit/runtime/synth";

/** 單音不超過 0.25 秒、音量不超過 0.14、一組最多三音。全部自己合成，不取樣、不借旋律。 */

/** 原創喇叭：先一個和弦的「叭」，再低一點的「嗚」。 */
export const HORN: readonly SynthVoice[] = [
  { wave: "square", freq: 392, dur: 0.22, vol: 0.06, attack: 0.02, filter: { type: "lowpass", freq: 1400 } },
  { wave: "triangle", freq: 588, dur: 0.22, vol: 0.08, attack: 0.02 },
  { wave: "triangle", freq: 494, dur: 0.24, vol: 0.09, at: 0.24, attack: 0.02 },
];

export const ARRIVE_CHIME: readonly SynthVoice[] = [
  { wave: "sine", freq: 784, dur: 0.2, vol: 0.1, at: 0 },
];

export const DOOR_CHIME: readonly SynthVoice[] = [
  { wave: "sine", freq: 660, dur: 0.12, vol: 0.1, at: 0 },
  { wave: "sine", freq: 880, dur: 0.14, vol: 0.08, at: 0.1 },
];

/** 桿子跳一格的「喀」。 */
export const NOTCH_CLICK: readonly SynthVoice[] = [
  { wave: "noise", dur: 0.03, vol: 0.09, attack: 0.002, filter: { type: "bandpass", freq: 2600, q: 3 } },
  { wave: "sine", freq: 1100, freqEnd: 700, dur: 0.04, vol: 0.05, attack: 0.002 },
];

/** 換動力桿時立刻給一聲很輕的馬達「嗡」，不必等車速起來。 */
export const POWER_LEVER_SOUND: readonly SynthVoice[] = [
  { wave: "triangle", freq: 110, freqEnd: 180, dur: 0.12, vol: 0.055, attack: 0.008 },
];

/** 換煞車桿時立刻給一聲很輕的進氣「噗」，不必等車開始減速。 */
export const BRAKE_LEVER_SOUND: readonly SynthVoice[] = [
  { wave: "noise", dur: 0.09, vol: 0.055, attack: 0.008, filter: { type: "bandpass", freq: 1100, q: 1.4 } },
];

/** 拉到緊急那一格，比較重的「咚」。 */
export const EMERGENCY_CLICK: readonly SynthVoice[] = [
  { wave: "noise", dur: 0.06, vol: 0.1, attack: 0.002, filter: { type: "bandpass", freq: 900, q: 1.5 } },
  { wave: "sine", freq: 220, freqEnd: 140, dur: 0.08, vol: 0.08, attack: 0.002 },
];

/** 輪子壓過軌道接縫的「喀噠」。音量跟速度走，最大不超過 0.07。 */
export function jointClack(speed: number): readonly SynthVoice[] {
  const vol = Math.min(0.07, 0.025 + Math.max(0, speed) * 0.05);
  const gap = Math.max(0.06, 0.13 - Math.max(0, speed) * 0.06);
  return [
    { wave: "noise", dur: 0.04, vol, attack: 0.002, filter: { type: "bandpass", freq: 1400, q: 2 } },
    { wave: "noise", at: gap, dur: 0.04, vol: vol * 0.8, attack: 0.002, filter: { type: "bandpass", freq: 1250, q: 2 } },
    { wave: "sine", freq: 160, freqEnd: 120, dur: 0.05, vol: vol * 0.6, attack: 0.002 },
  ];
}

/** 超過速度旗：溫柔的「叮叮」，不是警報。 */
export const AUTO_BRAKE_DING: readonly SynthVoice[] = [
  { wave: "sine", freq: 1175, dur: 0.12, vol: 0.07, attack: 0.005 },
  { wave: "sine", freq: 1175, dur: 0.14, vol: 0.06, at: 0.2, attack: 0.005 },
];

/** 停好時的原創到站短旋律：上行三音。 */
export const ARRIVAL_MELODY: readonly SynthVoice[] = [
  { wave: "triangle", freq: 659, dur: 0.18, vol: 0.09, attack: 0.01 },
  { wave: "triangle", freq: 784, dur: 0.18, vol: 0.09, at: 0.2, attack: 0.01 },
  { wave: "triangle", freq: 1047, dur: 0.25, vol: 0.08, at: 0.4, attack: 0.01 },
];

/** 大司機、小站長輕輕停好時，柔柔的放氣聲。 */
export const SMOOTH_STOP_SOUND: readonly SynthVoice[] = [
  { wave: "noise", dur: 0.2, vol: 0.045, attack: 0.025, filter: { type: "bandpass", freq: 850, q: 0.8 } },
  { wave: "sine", freq: 620, freqEnd: 470, dur: 0.22, vol: 0.04, attack: 0.015 },
];

/** 大司機、小站長停得比較急時，輕輕的「咚」。 */
export const BUMP_STOP_SOUND: readonly SynthVoice[] = [
  { wave: "sine", freq: 190, freqEnd: 120, dur: 0.16, vol: 0.065, attack: 0.004 },
  { wave: "noise", dur: 0.1, vol: 0.035, attack: 0.004, filter: { type: "lowpass", freq: 500 } },
];

/** 廣播前的「叮咚」。 */
export const ANNOUNCE_CHIME: readonly SynthVoice[] = [
  { wave: "sine", freq: 880, dur: 0.22, vol: 0.08, attack: 0.01 },
  { wave: "sine", freq: 698, dur: 0.25, vol: 0.08, at: 0.26, attack: 0.01 },
];

/** 對向列車擦身的「咻」：一段濾過的噪音由高往低。 */
export const PASS_WHOOSH: readonly SynthVoice[] = [
  { wave: "noise", dur: 0.25, vol: 0.1, attack: 0.08, filter: { type: "bandpass", freq: 1800, q: 0.8 } },
  { wave: "noise", dur: 0.25, vol: 0.09, at: 0.22, attack: 0.02, filter: { type: "bandpass", freq: 900, q: 0.8 } },
  { wave: "sine", freq: 330, freqEnd: 260, dur: 0.24, vol: 0.05, at: 0.12, attack: 0.03 },
];

/** 指差確認完成的「嗶」。 */
export const POINT_OK: readonly SynthVoice[] = [
  { wave: "triangle", freq: 988, dur: 0.08, vol: 0.08, attack: 0.004 },
  { wave: "triangle", freq: 1319, dur: 0.12, vol: 0.07, at: 0.09, attack: 0.004 },
];

export const CHIME_SETS = [
  HORN,
  ARRIVE_CHIME,
  DOOR_CHIME,
  NOTCH_CLICK,
  POWER_LEVER_SOUND,
  BRAKE_LEVER_SOUND,
  EMERGENCY_CLICK,
  AUTO_BRAKE_DING,
  ARRIVAL_MELODY,
  SMOOTH_STOP_SOUND,
  BUMP_STOP_SOUND,
  ANNOUNCE_CHIME,
  PASS_WHOOSH,
  POINT_OK,
  jointClack(0),
  jointClack(1),
] as const;

export function chimeWithinLimits(voices: readonly SynthVoice[]): boolean {
  if (voices.length === 0 || voices.length > 3) return false;
  return voices.every((voice) => voice.dur <= 0.25 && voice.vol <= 0.14);
}
