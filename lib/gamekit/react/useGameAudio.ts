"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameKitAudioBus, type SynthVoice } from "@/lib/gamekit/runtime/audio";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";
import type { GameKitGameId } from "@/lib/gamekit/types";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress-keys";
import {
  SFX_CHANGE_EVENT,
  invalidateSfxCache,
  isSfxEnabled,
  setSfxEnabled,
} from "@/lib/sfx";

function sfxEnabledInRaw(raw: string | null): boolean | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { sfxEnabled?: unknown };
    return typeof parsed.sfxEnabled === "boolean" ? parsed.sfxEnabled : null;
  } catch {
    return null;
  }
}

export function useGameAudio(gameId?: GameKitGameId) {
  const busRef = useRef<GameKitAudioBus | null>(null);
  const { gameVolume } = useGameKitSettings();
  const bgmWanted = useRef(false);
  /** 遊戲暫停中：開關聲音時不要在暫停畫面底下把音樂開回來（繼續時 Host 會再 playBgm）。 */
  const bgmPaused = useRef(false);
  const [soundUi, setSoundUi] = useState(true);

  const syncMuted = useCallback(() => {
    const on = isSfxEnabled();
    setSoundUi(on);
    busRef.current?.setMusicVolume(0.28 * gameVolume);
    busRef.current?.setSfxVolume(0.85 * gameVolume);
    busRef.current?.setMuted(!on);
    return on;
  }, [gameVolume]);

  const getBus = useCallback(() => {
    if (!busRef.current) busRef.current = new GameKitAudioBus();
    return busRef.current;
  }, []);

  const ensureAudio = useCallback(() => {
    const bus = getBus();
    bus.ensureContext();
    bus.setMusicVolume(0.28 * gameVolume);
    bus.setSfxVolume(0.85 * gameVolume);
    bus.setMuted(!isSfxEnabled());
  }, [gameVolume, getBus]);

  const tone = useCallback(
    (
      freq: number,
      dur: number,
      type: OscillatorType = "square",
      vol = 0.05,
    ) => {
      if (!isSfxEnabled()) return;
      getBus().playTone(freq, dur, type, vol);
    },
    [getBus],
  );

  const voices = useCallback(
    (list: readonly SynthVoice[]) => {
      if (!isSfxEnabled()) return;
      getBus().playVoices(list);
    },
    [getBus],
  );

  const playBgm = useCallback(() => {
    if (!gameId) return;
    bgmWanted.current = true;
    bgmPaused.current = false;
    if (!isSfxEnabled()) return;
    const bus = getBus();
    bus.ensureContext();
    bus.setMuted(false);
    bus.playBgm(gameId);
  }, [gameId, getBus]);

  const stopBgm = useCallback(() => {
    bgmWanted.current = false;
    bgmPaused.current = false;
    getBus().stopBgm();
  }, [getBus]);

  const pauseBgm = useCallback(() => {
    bgmPaused.current = true;
    getBus().pauseBgm();
  }, [getBus]);

  const resumeBgm = useCallback(() => {
    if (!isSfxEnabled() || !bgmWanted.current) return;
    bgmPaused.current = false;
    getBus().resumeBgm();
  }, [getBus]);

  const toggleSound = useCallback(() => {
    const next = !isSfxEnabled();
    setSfxEnabled(next);
    syncMuted();
    if (next && bgmWanted.current && !bgmPaused.current && gameId) {
      const bus = getBus();
      bus.ensureContext();
      bus.playBgm(gameId);
    }
  }, [gameId, getBus, syncMuted]);

  useEffect(() => {
    syncMuted();
    const onChange = () => {
      const on = syncMuted();
      if (!on) {
        getBus().pauseBgm();
      } else if (bgmWanted.current && !bgmPaused.current && gameId) {
        getBus().ensureContext();
        getBus().playBgm(gameId);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== PROGRESS_STORAGE_KEY) return;
      const previous = sfxEnabledInRaw(event.oldValue);
      const next = sfxEnabledInRaw(event.newValue);
      if (previous === next) return;
      invalidateSfxCache();
      onChange();
    };
    window.addEventListener(SFX_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SFX_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [gameId, getBus, syncMuted]);

  useEffect(
    () => () => {
      busRef.current?.dispose();
    },
    [],
  );

  return {
    ensureAudio,
    tone,
    voices,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
  };
}
