/**
 * 《多多壽司屋》朗讀。瀏覽器 Web Speech API；沒有 speechSynthesis（SSR、測試、舊瀏覽器）時安靜不做。
 */

export const SPEECH_LANG = "zh-TW";
/** 稍慢，五歲孩子聽得清楚。 */
export const SPEECH_RATE = 0.9;
/** 比預設 1 高一點，聽起來像輕快的小朋友。 */
export const SPEECH_PITCH = 1.2;
/** 靜音記在這個 key：「off」關掉，「on」或沒寫過都開著。 */
export const VOICE_MUTE_STORAGE_KEY = "cheche:dino-sushi-voice";

type SpeechSynth = {
  speak: (utterance: SpeechSynthesisUtterance) => void;
  cancel: () => void;
};

function speechSynth(): SpeechSynth | null {
  if (typeof window === "undefined") return null;
  const synth = window.speechSynthesis;
  if (!synth || typeof synth.speak !== "function" || typeof synth.cancel !== "function") return null;
  return synth;
}

function utteranceCtor(): typeof SpeechSynthesisUtterance | null {
  if (typeof window === "undefined") return null;
  if (typeof window.SpeechSynthesisUtterance !== "function") return null;
  return window.SpeechSynthesisUtterance;
}

/** 取消還沒念完的句子。沒有 API 時不做。 */
export function cancelSpeech(): void {
  const synth = speechSynth();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    // 某些瀏覽器在沒講過話時 cancel 會丟錯
  }
}

/** 念一句。先取消上一句，避免新訂單和多多的字卡疊在一起。 */
export function speakText(text: string): void {
  if (!text) return;
  const synth = speechSynth();
  const Utterance = utteranceCtor();
  if (!synth || !Utterance) return;
  try {
    synth.cancel();
    const utter = new Utterance(text);
    utter.lang = SPEECH_LANG;
    utter.rate = SPEECH_RATE;
    utter.pitch = SPEECH_PITCH;
    synth.speak(utter);
  } catch {
    // 瀏覽器拒講，或測試裡的假物件不完整
  }
}

export function readVoiceMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(VOICE_MUTE_STORAGE_KEY) === "off";
  } catch {
    return false;
  }
}

export function writeVoiceMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOICE_MUTE_STORAGE_KEY, muted ? "off" : "on");
  } catch {
    // 無痕模式寫不進去，這一次先記在記憶體
  }
}
