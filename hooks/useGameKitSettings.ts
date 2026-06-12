"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type BlockDropDifficulty,
  type BlockDropSpecialMode,
  GAMEKIT_SETTINGS_EVENT,
  loadGameKitSettings,
  saveGameKitSettings,
  type GameKitSettings,
} from "@/lib/gamekit/settings";

export function useGameKitSettings() {
  const [settings, setSettings] = useState<GameKitSettings | null>(null);

  const refresh = useCallback(() => {
    setSettings(loadGameKitSettings());
  }, []);

  const update = useCallback((patch: Partial<GameKitSettings>) => {
    const next = { ...loadGameKitSettings(), ...patch };
    saveGameKitSettings(next);
    setSettings(next);
    return next;
  }, []);

  const setKidsMode = useCallback(
    (enabled: boolean) => update({ kidsMode: enabled }),
    [update],
  );

  const setBlockDropDifficulty = useCallback(
    (difficulty: BlockDropDifficulty) =>
      update({ blockDropDifficulty: difficulty }),
    [update],
  );

  const setBlockDropSpecialMode = useCallback(
    (specialMode: BlockDropSpecialMode) =>
      update({ blockDropSpecialMode: specialMode }),
    [update],
  );

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(GAMEKIT_SETTINGS_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(GAMEKIT_SETTINGS_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return {
    settings,
    kidsMode: settings?.kidsMode ?? true,
    blockDropDifficulty: settings?.blockDropDifficulty ?? "relaxed",
    blockDropSpecialMode: settings?.blockDropSpecialMode ?? "classic",
    refresh,
    update,
    setKidsMode,
    setBlockDropDifficulty,
    setBlockDropSpecialMode,
  };
}
