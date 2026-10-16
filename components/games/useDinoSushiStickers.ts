"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  addDinoSushiStickers,
  loadDinoSushiStickers,
  markDinoSushiStickersSeen,
  saveDinoSushiStickerState,
  type DinoSushiStickerState,
} from "@/lib/gamekit/progress/dino-sushi-stickers";
import { cancelSpeech, speakText } from "@/lib/games/shared/speech";
import {
  applyRoundStickers,
  stickerAnnouncement,
  type ApplyState,
} from "@/lib/games/dino-sushi/stickers";
import type { RoundState } from "@/lib/games/dino-sushi/round";

const PLAY_STORAGE_KEY = "cheche:dino-sushi-sticker-play";

let playId = "";
let playState: ApplyState | null = null;
let dailyAnnounced = false;

function rememberPlayId(id: string) {
  playId = id;
  try {
    sessionStorage.setItem(PLAY_STORAGE_KEY, id);
  } catch {
    // 隱私模式沒有 sessionStorage 時，這一頁仍用記憶體裡的 id
  }
}

export function beginDinoSushiStickerRound(): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  playState = null;
  rememberPlayId(id);
  return id;
}

function currentPlayId(): string {
  if (playId) return playId;
  try {
    playId = sessionStorage.getItem(PLAY_STORAGE_KEY) ?? "";
  } catch {
    playId = "";
  }
  return playId;
}

export type StickerVoice = { on: boolean; volume: number };

/**
 * 標題頁進來先領「天天來」；廚房裡每一步把新貼紙寫進存檔；
 * 一輪結束若還沒有新的，保底一張。念出來跟著音效跟「念出來」開關。
 */
export function useDinoSushiStickers(round: RoundState | null, voice: StickerVoice) {
  const [state, setState] = useState<DinoSushiStickerState>(() => loadDinoSushiStickers());
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const spokenPlay = useRef("");

  const say = useCallback((text: string, interrupt: boolean) => {
    const now = voiceRef.current;
    if (!now.on || !text) return;
    speakText(text, { interrupt, volume: now.volume });
  }, []);

  useEffect(() => {
    if (!voiceRef.current.on) cancelSpeech();
  }, [voice.on]);

  useEffect(() => {
    const { state: next, added } = addDinoSushiStickers(["surprise-daily"]);
    setState(next);
    if (added.includes("surprise-daily") && !dailyAnnounced) {
      dailyAnnounced = true;
      say(stickerAnnouncement(["surprise-daily"], null), false);
    }
  }, [say]);

  useEffect(() => {
    if (!round) return;
    const play = currentPlayId();
    if (!play) return;
    const stored = loadDinoSushiStickers();
    const applied = applyRoundStickers(stored.unlocked, playState, play, round, stored.roundKey);
    playState = applied.state;
    if (applied.alreadySettled) return;
    if (applied.added.length === 0 && !round.done) return;
    const next = saveDinoSushiStickerState({
      ...stored,
      unlocked: [...stored.unlocked, ...applied.added],
      fresh: applied.state.earned,
      gift: applied.state.gifted ?? "",
      roundKey: round.done ? play : stored.roundKey,
    });
    setState(next);
    if (round.done && applied.state.earned.length > 0 && spokenPlay.current !== play) {
      spokenPlay.current = play;
      say(stickerAnnouncement(applied.state.earned, applied.state.gifted), false);
    }
  }, [round, say]);

  const beginRound = useCallback(() => {
    beginDinoSushiStickerRound();
    spokenPlay.current = "";
  }, []);

  const markSeen = useCallback(() => {
    setState(markDinoSushiStickersSeen());
  }, []);

  const speak = useCallback((text: string) => say(text, true), [say]);

  return { state, beginRound, markSeen, speak };
}
