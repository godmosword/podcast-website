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

export const CHIME_SETS = [
  HORN,
  ARRIVE_CHIME,
  DOOR_CHIME,
  NOTCH_CLICK,
  EMERGENCY_CLICK,
  jointClack(0),
  jointClack(1),
] as const;

export function chimeWithinLimits(voices: readonly SynthVoice[]): boolean {
  if (voices.length === 0 || voices.length > 3) return false;
  return voices.every((voice) => voice.dur <= 0.25 && voice.vol <= 0.14);
}
