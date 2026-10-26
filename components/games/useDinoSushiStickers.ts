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

/** 這一頁自己的局號。不讀 sessionStorage：複製分頁會把另一頁的 key 帶過來，結算會被當成已經送過。 */
let playId = "";
let playState: ApplyState | null = null;
let dailyAnnounced = false;

export const STICKER_SAVE_ERROR = "貼紙沒放進書裡，再試一次。";

export function beginDinoSushiStickerRound(): string {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  playState = null;
  playId = id;
  return id;
}

export function dinoSushiStickerPlayId(): string {
  return playId;
}

export type StickerVoice = { on: boolean; volume: number };

/**
 * 標題頁進來先領「第一次來」；廚房裡每一步把新貼紙寫進存檔；
 * 一輪結束若還沒有新的，保底一張。念出來跟著音效跟「念出來」開關。
 * 存檔失敗不更新記憶體，畫面上留一句可以再試。
 */
export function useDinoSushiStickers(round: RoundState | null, voice: StickerVoice) {
  const [state, setState] = useState<DinoSushiStickerState>(() => loadDinoSushiStickers());
  const [saveError, setSaveError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  const spokenPlay = useRef("");
  const failBits = useRef(0);

  const say = useCallback((text: string, interrupt: boolean) => {
    const now = voiceRef.current;
    if (!now.on || !text) return;
    speakText(text, { interrupt, volume: now.volume });
  }, []);

  const noteSave = useCallback((bit: number, ok: boolean) => {
    failBits.current = ok ? failBits.current & ~bit : failBits.current | bit;
    setSaveError(failBits.current ? STICKER_SAVE_ERROR : "");
  }, []);

  useEffect(() => {
    if (!voiceRef.current.on) cancelSpeech();
  }, [voice.on]);

  useEffect(() => {
    const { state: next, added, ok } = addDinoSushiStickers(["surprise-daily"]);
    noteSave(1, ok);
    if (!ok) return;
    setState(next);
    if (added.includes("surprise-daily") && !dailyAnnounced) {
      dailyAnnounced = true;
      say(stickerAnnouncement(["surprise-daily"], null), false);
    }
  }, [attempt, noteSave, say]);

  useEffect(() => {
    if (!round) return;
    const play = playId;
    if (!play) return;
    const stored = loadDinoSushiStickers();
    const applied = applyRoundStickers(stored.unlocked, playState, play, round, stored.roundKey);
    if (applied.alreadySettled) return;
    if (applied.added.length === 0 && !round.done) return;
    const saved = saveDinoSushiStickerState({
      ...stored,
      unlocked: [...stored.unlocked, ...applied.added],
      fresh: applied.state.earned,
      gift: applied.state.gifted ?? "",
      roundKey: round.done ? play : stored.roundKey,
    });
    noteSave(2, saved.ok);
    if (!saved.ok) return;
    playState = applied.state;
    setState(saved.state);
    if (round.done && applied.state.earned.length > 0 && spokenPlay.current !== play) {
      spokenPlay.current = play;
      say(stickerAnnouncement(applied.state.earned, applied.state.gifted), false);
    }
  }, [attempt, noteSave, round, say]);

  const beginRound = useCallback(() => {
    beginDinoSushiStickerRound();
    spokenPlay.current = "";
  }, []);

  const markSeen = useCallback(() => {
    const before = loadDinoSushiStickers();
    const next = markDinoSushiStickersSeen();
    const wrote =
      before.seen.length === before.unlocked.length || next.seen.length >= before.unlocked.length;
    noteSave(4, wrote);
    if (!wrote) return;
    setState(next);
  }, [noteSave]);

  const retrySave = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  const speak = useCallback((text: string) => say(text, true), [say]);

  return { state, saveError, beginRound, markSeen, retrySave, speak };
}
