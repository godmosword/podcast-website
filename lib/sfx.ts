/**
 * 互動音效：用 WebAudio 振盪器即時合成短音，零音檔、零下載、零網路，
 * 完全貼合「音檔不外送、零金鑰」精神。預設開，提供靜音切換。
 */

import {
  isSfxEnabledInStore,
  setSfxEnabledInStore,
} from "@/lib/progress-store";

export type SfxKind = "tap" | "flip" | "collect";

export const SFX_CHANGE_EVENT = "cc:sfx-change";

type WebkitWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let ctx: AudioContext | null = null;
let enabledCache: boolean | null = null;

/** 是否啟用音效（預設 on；SSR 視為關閉，避免在伺服器端誤觸）。 */
export function isSfxEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (enabledCache !== null) return enabledCache;
  try {
    enabledCache = isSfxEnabledInStore();
  } catch {
    enabledCache = true;
  }
  return enabledCache;
}

/** 切換音效偏好並廣播，讓所有切換鈕同步。 */
export function setSfxEnabled(on: boolean): void {
  enabledCache = on;
  try {
    setSfxEnabledInStore(on);
  } catch {
    // localStorage 不可用時僅本次有效。
  }
  window.dispatchEvent(new CustomEvent(SFX_CHANGE_EVENT, { detail: on }));
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  // 瀏覽器在首次使用者手勢前會 suspend；所有 playSfx 來自點擊，resume 可解鎖。
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Tone = {
  freq: number;
  type: OscillatorType;
  dur: number;
  gain: number;
  slideTo?: number;
};

const TONES: Record<SfxKind, Tone> = {
  tap: { freq: 660, type: "sine", dur: 0.09, gain: 0.12 },
  flip: { freq: 520, type: "triangle", dur: 0.12, gain: 0.1, slideTo: 760 },
  collect: { freq: 720, type: "sine", dur: 0.2, gain: 0.14, slideTo: 1080 },
};

/** 播放一個短音；未啟用或環境不支援時靜默 no-op。 */
export function playSfx(kind: SfxKind): void {
  if (!isSfxEnabled()) return;
  const c = getCtx();
  if (!c) return;

  const tone = TONES[kind];
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = tone.type;
  osc.frequency.setValueAtTime(tone.freq, now);
  if (tone.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(tone.slideTo, now + tone.dur);
  }

  // 快起快落的包絡，避免爆音。
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(tone.gain, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.dur);

  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(now + tone.dur + 0.02);
}

/** 外部 store 更新時重置快取。 */
export function invalidateSfxCache(): void {
  enabledCache = null;
}
