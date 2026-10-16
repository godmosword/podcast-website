"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import { cancelSpeech, clearLegacyVoiceSetting, isSpeaking, speakText } from "@/lib/games/shared/speech";

type Options = {
  /** 換單才變（種子＋第幾單）。空的表示現在沒有訂單。 */
  orderToken: string | null;
  orderLine: string | null;
  /** 一輪的第一單：插隊，清掉上一輪還沒念完的。 */
  firstOrder: boolean;
  /** 多多的字卡；同一個物件不重複念。 */
  caption: Reaction | null;
  /**
   * 這單做對時，接在多多字卡後面一起念的朋友台詞。
   * 跟字卡合成一句：共用朗讀只留一句排隊，分開念會把字卡蓋掉。
   */
  thanksLine: string | null;
  inputPaused: boolean;
  /** 抬頭的「音效」開關；朗讀跟它同一個開關。 */
  soundOn: boolean;
  /** 遊戲音量 0–1；0 等於關掉。 */
  volume: number;
  /** 遊戲設定的「念出來」；關掉只停朗讀，音效照常。 */
  voiceEnabled: boolean;
};

/**
 * 新訂單、多多的字卡出現時念出來。做對時朋友的話接在字卡後面，合成一句。
 * 字卡念完才接著念下一單，不會被換單切掉。
 * 音效或音量改了只影響之後的句子，不會重念。暫停、關音效、關「念出來」、卸載都會取消。
 */
export function useDinoSushiSpeech({
  orderToken,
  orderLine,
  firstOrder,
  caption,
  thanksLine,
  inputPaused,
  soundOn,
  volume,
  voiceEnabled,
}: Options) {
  const voiceOn = soundOn && volume > 0 && voiceEnabled;
  const live = useRef({ voiceOn, paused: inputPaused, volume });
  live.current = { voiceOn, paused: inputPaused, volume };

  useEffect(() => clearLegacyVoiceSetting(), []);

  useEffect(() => () => cancelSpeech(), []);

  useEffect(() => {
    if (inputPaused || !voiceOn) cancelSpeech();
  }, [inputPaused, voiceOn]);

  const say = useCallback((text: string, interrupt: boolean) => {
    const now = live.current;
    if (!now.voiceOn || now.paused) return;
    speakText(text, { interrupt, volume: now.volume });
  }, []);

  useEffect(() => {
    if (orderToken && orderLine) say(orderLine, firstOrder);
  }, [firstOrder, orderLine, orderToken, say]);

  useEffect(() => {
    if (!caption) return;
    say(thanksLine ? `${caption.line}${thanksLine}` : caption.line, false);
  }, [caption, say, thanksLine]);

  /** 點泡泡再聽一次：插隊；同一句正在念就不從頭念。 */
  const replay = useCallback(() => {
    if (!orderLine || isSpeaking(orderLine)) return;
    say(orderLine, true);
  }, [orderLine, say]);

  return { voiceOn, replay };
}
