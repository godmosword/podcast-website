import { useCallback, useRef, useState } from "react";

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

export function useGameAudio(initialOn = true) {
  const actx = useRef<AudioContext | null>(null);
  const soundOn = useRef(initialOn);
  const [soundUi, setSoundUi] = useState(initialOn);

  const ensureAudio = useCallback(() => {
    if (!actx.current) {
      try {
        const Ctor =
          window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
        if (Ctor) actx.current = new Ctor();
      } catch {
        // 無音訊環境時略過
      }
    }
    if (actx.current && actx.current.state === "suspended") {
      void actx.current.resume();
    }
  }, []);

  const tone = useCallback(
    (
      freq: number,
      dur: number,
      type: OscillatorType = "square",
      vol = 0.05,
    ) => {
      const ctx = actx.current;
      if (!soundOn.current || !ctx) return;
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        o.stop(ctx.currentTime + dur);
      } catch {
        // 略過
      }
    },
    [],
  );

  const toggleSound = useCallback(() => {
    soundOn.current = !soundOn.current;
    setSoundUi(soundOn.current);
  }, []);

  return { ensureAudio, tone, soundOn, soundUi, toggleSound };
}
