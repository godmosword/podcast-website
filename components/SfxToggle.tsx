"use client";

import { useEffect, useState, type RefObject } from "react";
import {
  SFX_CHANGE_EVENT,
  isSfxEnabled,
  playSfx,
  setSfxEnabled,
} from "@/lib/sfx";
import { VolumeOffIcon, VolumeOnIcon } from "./decor/PlayerIcon";

type SfxToggleProps = {
  className?: string;
  audioRef?: RefObject<HTMLAudioElement | null>;
};

/** 音量切換：旁白 muted + UI 互動短音一鍵控制。 */
export default function SfxToggle({ className = "", audioRef }: SfxToggleProps) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const enabled = isSfxEnabled();
    setOn(enabled);
    const el = audioRef?.current;
    if (el) el.muted = !enabled;

    const sync = () => {
      const next = isSfxEnabled();
      setOn(next);
      const audio = audioRef?.current;
      if (audio) audio.muted = !next;
    };
    window.addEventListener(SFX_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SFX_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [audioRef]);

  function toggle() {
    const next = !on;
    setSfxEnabled(next);
    setOn(next);
    const el = audioRef?.current;
    if (el) el.muted = !next;
    if (next) playSfx("tap");
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "關閉聲音" : "開啟聲音"}
      title={on ? "聲音：開" : "聲音：關"}
    >
      {on ? <VolumeOnIcon size={22} /> : <VolumeOffIcon size={22} />}
    </button>
  );
}
