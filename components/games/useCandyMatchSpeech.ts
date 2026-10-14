"use client";

import { useCallback, useEffect, useRef } from "react";
import { isSfxEnabled, setSfxEnabled } from "@/lib/sfx";
import {
  cancelSpeech,
  clearLegacyVoiceSetting,
  isSpeaking,
  speakText,
} from "@/lib/games/shared/speech";
import type { CandySpeechCue } from "./useCandyMatchPlay";

type Options = {
  /** 不在局內（回地圖、標題）時取消，也不念。 */
  active: boolean;
  /** 開局目標、鼓勵、提示、過關、步數用完。null 表示還沒有要念的。 */
  cue: CandySpeechCue | null;
  inputPaused: boolean;
  /** 抬頭的「音效」開關；朗讀跟它同一個開關。 */
  soundOn: boolean;
  /** 遊戲音量 0–1；0 等於關掉。 */
  volume: number;
  /** 遊戲設定的「念出來」；關掉只停朗讀，音效照常。 */
  voiceEnabled: boolean;
};

/**
 * 開局念目標，之後念鼓勵、提示、過關與步數用完。
 * 換關（新的 cue）、暫停、關音效、關「念出來」、離開局內、卸載都會取消還沒念完的。
 * 局內的靜音鈕跟抬頭音效同一個開關；家長要只關人聲，用遊戲設定的「念出來」。
 */
export function useCandyMatchSpeech({ active, cue, inputPaused, soundOn, volume, voiceEnabled }: Options) {
  const voiceOn = soundOn && volume > 0 && voiceEnabled;
  const live = useRef({ voiceOn, paused: inputPaused, active, volume });
  live.current = { voiceOn, paused: inputPaused, active, volume };
  const lastText = useRef<string | null>(null);

  useEffect(() => clearLegacyVoiceSetting(), []);

  useEffect(() => () => cancelSpeech(), []);

  useEffect(() => {
    if (!active || inputPaused || !voiceOn) cancelSpeech();
  }, [active, inputPaused, voiceOn]);

  const say = useCallback((text: string, interrupt: boolean) => {
    const now = live.current;
    if (!now.active || !now.voiceOn || now.paused) return;
    speakText(text, { interrupt, volume: now.volume });
  }, []);

  useEffect(() => {
    if (!cue) return;
    // 音效關著時也記住，打開之後「再聽一次」才念得出來。
    lastText.current = cue.text;
    say(cue.text, cue.interrupt);
  }, [cue, say]);

  /** 再聽一次剛剛那句。同一句正在念就不從頭念；音效關著時不出聲。 */
  const replay = useCallback(() => {
    const text = lastText.current;
    if (!text || isSpeaking(text)) return;
    say(text, true);
  }, [say]);

  const toggleMuted = useCallback(() => {
    const nextOn = !isSfxEnabled();
    setSfxEnabled(nextOn);
    if (!nextOn) cancelSpeech();
  }, []);

  /** 念指定的一句（點目標卡）。音效關著時不出聲。 */
  const speak = useCallback(
    (text: string) => {
      lastText.current = text;
      say(text, true);
    },
    [say],
  );

  return { voiceOn, muted: !voiceOn, replay, speak, toggleMuted };
}
