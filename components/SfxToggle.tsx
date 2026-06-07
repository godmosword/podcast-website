"use client";

import { useEffect, useState } from "react";
import {
  SFX_CHANGE_EVENT,
  isSfxEnabled,
  playSfx,
  setSfxEnabled,
} from "@/lib/sfx";

type SfxToggleProps = {
  className?: string;
};

/** 音效靜音切換 🔊/🔇。SSR 初值固定（開），掛載後讀 localStorage，避免 hydration mismatch。 */
export default function SfxToggle({ className = "" }: SfxToggleProps) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    setOn(isSfxEnabled());
    const sync = () => setOn(isSfxEnabled());
    window.addEventListener(SFX_CHANGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SFX_CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  function toggle() {
    const next = !on;
    setSfxEnabled(next);
    setOn(next);
    if (next) playSfx("tap"); // 開啟時給個回饋音
  }

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "關閉音效" : "開啟音效"}
      title={on ? "音效：開" : "音效：關"}
    >
      {on ? "🔊" : "🔇"}
    </button>
  );
}
