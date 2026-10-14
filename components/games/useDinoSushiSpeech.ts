"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import { cancelSpeech, readVoiceMuted, speakText, writeVoiceMuted } from "@/lib/games/dino-sushi/speech";

type Options = {
  /** 換單才變（種子＋第幾單）。空的表示現在沒有訂單。 */
  orderToken: string | null;
  orderLine: string | null;
  /** 多多的字卡；同一個物件不重複念。 */
  caption: Reaction | null;
  inputPaused: boolean;
};

/**
 * 新訂單、多多的字卡出現時念出來。靜音記在 localStorage。
 * 換單、暫停、卸載都會取消還沒念完的句子。
 */
export function useDinoSushiSpeech({ orderToken, orderLine, caption, inputPaused }: Options) {
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const pausedRef = useRef(inputPaused);
  pausedRef.current = inputPaused;

  useEffect(() => {
    const stored = readVoiceMuted();
    mutedRef.current = stored;
    setMuted(stored);
  }, []);

  useEffect(() => () => cancelSpeech(), []);

  useEffect(() => {
    if (inputPaused) cancelSpeech();
  }, [inputPaused]);

  const canSpeak = useCallback(() => !mutedRef.current && !pausedRef.current, []);

  useEffect(() => {
    if (!orderToken || !orderLine || !canSpeak()) return;
    speakText(orderLine);
    return () => cancelSpeech();
  }, [canSpeak, orderLine, orderToken]);

  useEffect(() => {
    if (!caption || !canSpeak()) return;
    speakText(caption.line);
    return () => cancelSpeech();
  }, [canSpeak, caption]);

  const toggleMuted = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    writeVoiceMuted(next);
    if (next) cancelSpeech();
    setMuted(next);
  }, []);

  const replay = useCallback(() => {
    if (!orderLine || !canSpeak()) return;
    speakText(orderLine);
  }, [canSpeak, orderLine]);

  return { muted, toggleMuted, replay };
}
