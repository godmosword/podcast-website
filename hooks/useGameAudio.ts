import { useCallback, useEffect, useRef, useState } from "react";
import { GameKitAudioBus } from "@/lib/gamekit/audio";
import type { GameKitGameId } from "@/lib/gamekit/types";

export function useGameAudio(initialOn = true, gameId?: GameKitGameId) {
  const busRef = useRef<GameKitAudioBus | null>(null);
  const soundOn = useRef(initialOn);
  const bgmWanted = useRef(false);
  const [soundUi, setSoundUi] = useState(initialOn);

  const getBus = useCallback(() => {
    if (!busRef.current) busRef.current = new GameKitAudioBus();
    return busRef.current;
  }, []);

  const ensureAudio = useCallback(() => {
    const bus = getBus();
    bus.ensureContext();
    bus.setMuted(!soundOn.current);
  }, [getBus]);

  const tone = useCallback(
    (
      freq: number,
      dur: number,
      type: OscillatorType = "square",
      vol = 0.05,
    ) => {
      if (!soundOn.current) return;
      getBus().playTone(freq, dur, type, vol);
    },
    [getBus],
  );

  const playBgm = useCallback(() => {
    if (!gameId) return;
    bgmWanted.current = true;
    if (!soundOn.current) return;
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
    if (!soundOn.current || !bgmWanted.current) return;
    getBus().resumeBgm();
  }, [getBus]);

  const toggleSound = useCallback(() => {
    const next = !soundOn.current;
    soundOn.current = next;
    setSoundUi(next);
    const bus = getBus();
    bus.setMuted(!next);
    if (next && bgmWanted.current && gameId) {
      bus.playBgm(gameId);
    }
  }, [gameId, getBus]);

  useEffect(
    () => () => {
      busRef.current?.stopBgm();
    },
    [],
  );

  return {
    ensureAudio,
    tone,
    soundOn,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
  };
}
