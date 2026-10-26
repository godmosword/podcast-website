import type { SynthVoice } from "@/lib/gamekit/runtime/synth";

/** 單音不超過 0.25 秒、音量不超過 0.14、一組最多三音。 */

export const HORN: readonly SynthVoice[] = [
  { wave: "triangle", freq: 523, dur: 0.16, vol: 0.12, at: 0 },
  { wave: "triangle", freq: 659, dur: 0.18, vol: 0.1, at: 0.14 },
];

export const ARRIVE_CHIME: readonly SynthVoice[] = [
  { wave: "sine", freq: 784, dur: 0.2, vol: 0.1, at: 0 },
];

export const DOOR_CHIME: readonly SynthVoice[] = [
  { wave: "sine", freq: 660, dur: 0.12, vol: 0.1, at: 0 },
  { wave: "sine", freq: 880, dur: 0.14, vol: 0.08, at: 0.1 },
];

export const CHIME_SETS = [HORN, ARRIVE_CHIME, DOOR_CHIME] as const;

export function chimeWithinLimits(voices: readonly SynthVoice[]): boolean {
  if (voices.length === 0 || voices.length > 3) return false;
  return voices.every((voice) => voice.dur <= 0.25 && voice.vol <= 0.14);
}
