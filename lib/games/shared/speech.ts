/**
 * 遊戲朗讀。瀏覽器 Web Speech API；沒有 speechSynthesis（SSR、測試、舊瀏覽器）時安靜不做。
 * 多多壽司屋與車車消消樂共用；行為與原本壽司屋的朗讀相同。
 * 開關跟抬頭的「音效」同一個（由各遊戲的 hook 決定念不念），這裡只管怎麼念。
 */

export const SPEECH_LANG = "zh-TW";
/** 稍慢，五歲孩子聽得清楚。 */
export const SPEECH_RATE = 0.9;
/** 比預設 1 高一點，聽起來像輕快的小朋友。 */
export const SPEECH_PITCH = 1.2;
/** #215 曾用這個 key 記獨立的朗讀靜音；現在改跟抬頭音效，舊值清掉免得裝置一直靜音。 */
export const LEGACY_VOICE_MUTE_STORAGE_KEY = "cheche:dino-sushi-voice";

type SpeechSynth = {
  speak: (utterance: SpeechSynthesisUtterance) => void;
  cancel: () => void;
  speaking?: boolean;
  pending?: boolean;
};

export type SpeakOptions = {
  /**
   * true（預設）：清掉排隊的、打斷正在念的，立刻念這句。
   * false：正在念就排在後面，念完才接著念；只留最新的一句，舊的丟掉，聲音才不會越拖越晚。
   */
  interrupt?: boolean;
  /** 0–1，跟遊戲音量。0 不念（iOS 不理 utterance.volume）。 */
  volume?: number;
};

/** 正在念的那一句：onend 對得上才接下一句，被 cancel 掉的舊句子不會誤觸發。 */
let current: SpeechSynthesisUtterance | null = null;
/** 這一句最晚該念完的時間（Date.now）。 */
let currentDeadline = 0;
/** 排在後面的一句。 */
let waiting: { text: string; volume: number } | null = null;

function speechSynth(): SpeechSynth | null {
  if (typeof window === "undefined") return null;
  const synth = window.speechSynthesis as SpeechSynth | undefined;
  if (!synth || typeof synth.speak !== "function" || typeof synth.cancel !== "function") return null;
  return synth;
}

function utteranceCtor(): typeof SpeechSynthesisUtterance | null {
  if (typeof window === "undefined") return null;
  if (typeof window.SpeechSynthesisUtterance !== "function") return null;
  return window.SpeechSynthesisUtterance;
}

/**
 * 一句最多念多久：稍慢的童聲一個字約 0.3 秒，抓寬一點。
 * 過了還沒 onend 就當它卡住了（iOS 被來電、Siri 搶走音訊時 speaking 可能一直是 true）。
 */
function speechBudgetMs(text: string): number {
  return 2000 + text.length * 400;
}

/**
 * 真的還在念。同時看瀏覽器狀態與時限，不讓排隊卡住：
 * iOS 沒手勢時整句沒開始也不給 onend；被打斷時 onend 遺失但 speaking 一直是 true。
 */
function busy(synth: SpeechSynth): boolean {
  if (current === null || Date.now() > currentDeadline) return false;
  return synth.speaking === true || synth.pending === true;
}

function speakNow(synth: SpeechSynth, Utterance: typeof SpeechSynthesisUtterance, text: string, volume: number) {
  const utter = new Utterance(text);
  utter.lang = SPEECH_LANG;
  utter.rate = SPEECH_RATE;
  utter.pitch = SPEECH_PITCH;
  utter.volume = Math.min(1, volume);
  const done = () => {
    if (current !== utter) return;
    current = null;
    const next = waiting;
    waiting = null;
    if (next) {
      try {
        speakNow(synth, Utterance, next.text, next.volume);
      } catch {
        current = null;
      }
    }
  };
  utter.onend = done;
  utter.onerror = done;
  current = utter;
  currentDeadline = Date.now() + speechBudgetMs(text);
  synth.speak(utter);
}

/** 取消還沒念完的句子與排隊。沒有 API 時不做。 */
export function cancelSpeech(): void {
  waiting = null;
  current = null;
  const synth = speechSynth();
  if (!synth) return;
  try {
    synth.cancel();
  } catch {
    // 某些瀏覽器在沒講過話時 cancel 會丟錯
  }
}

/** 念一句。見 SpeakOptions：新訂單與字卡排隊，「再聽一次」與新一輪插隊。 */
export function speakText(text: string, { interrupt = true, volume = 1 }: SpeakOptions = {}): void {
  if (!text || !(volume > 0)) return;
  const synth = speechSynth();
  const Utterance = utteranceCtor();
  if (!synth || !Utterance) return;
  if (!interrupt && busy(synth)) {
    waiting = { text, volume };
    return;
  }
  try {
    waiting = null;
    current = null;
    // 瀏覽器沒在念就不必 cancel：WebKit 在 cancel 後立刻 speak 偶爾會吃掉那一句
    if (interrupt && (synth.speaking === true || synth.pending === true)) synth.cancel();
    speakNow(synth, Utterance, text, volume);
  } catch {
    // 瀏覽器拒講，或測試裡的假物件不完整
    current = null;
  }
}

/** 這句正在念（連點「再聽一次」不要一直從頭念）。 */
export function isSpeaking(text: string): boolean {
  const synth = speechSynth();
  return synth !== null && current?.text === text && busy(synth);
}

/** 清掉 #215 的獨立靜音值。無痕模式寫不進去也沒關係。 */
export function clearLegacyVoiceSetting(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_VOICE_MUTE_STORAGE_KEY);
  } catch {
    // 讀不到就算了
  }
}
