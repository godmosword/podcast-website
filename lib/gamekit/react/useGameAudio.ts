"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameKitAudioBus } from "@/lib/gamekit/runtime/audio";
import type { GameKitGameId } from "@/lib/gamekit/types";
import {
  SFX_CHANGE_EVENT,
  isSfxEnabled,
  setSfxEnabled,
} from "@/lib/sfx";

export function useGameAudio(gameId?: GameKitGameId) {
  const busRef = useRef<GameKitAudioBus | null>(null);
  const bgmWanted = useRef(false);
  const [soundUi, setSoundUi] = useState(true);

  const syncMuted = useCallback(() => {
    const on = isSfxEnabled();
    setSoundUi(on);
    busRef.current?.setMuted(!on);
    return on;
  }, []);

  const getBus = useCallback(() => {
    if (!busRef.current) busRef.current = new GameKitAudioBus();
    return busRef.current;
  }, []);

  const ensureAudio = useCallback(() => {
    const bus = getBus();
    bus.ensureContext();
    bus.setMuted(!isSfxEnabled());
  }, [getBus]);

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

  const playBgm = useCallback(() => {
    if (!gameId) return;
    bgmWanted.current = true;
    if (!isSfxEnabled()) return;
    const bus = getBus();
    bus.ensureContext();
    bus.setMuted(false);
    bus.playBgm(gameId);
  }, [gameId, getBus]);

  const stopBgm = useCallback(() => {
    bgmWanted.current = false;
    getBus().stopBgm();
  }, [getBus]);

  const pauseBgm = useCallback(() => {
    getBus().pauseBgm();
  }, [getBus]);

  const resumeBgm = useCallback(() => {
    if (!isSfxEnabled() || !bgmWanted.current) return;
    getBus().resumeBgm();
  }, [getBus]);

  const toggleSound = useCallback(() => {
    const next = !isSfxEnabled();
    setSfxEnabled(next);
    syncMuted();
    if (next && bgmWanted.current && gameId) {
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
      } else if (bgmWanted.current && gameId) {
        getBus().ensureContext();
        getBus().playBgm(gameId);
      }
    };
    window.addEventListener(SFX_CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SFX_CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [gameId, getBus, syncMuted]);

  useEffect(
    () => () => {
      busRef.current?.stopBgm();
    },
    [],
  );

  return {
    ensureAudio,
    tone,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
  };
}
