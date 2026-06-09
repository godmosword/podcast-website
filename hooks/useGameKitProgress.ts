"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GAMEKIT_PROGRESS_EVENT,
  loadPlayerProfile,
  type PlayerProfile,
} from "@/lib/gamekit";

export function useGameKitProgress() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const refresh = useCallback(() => {
    setProfile(loadPlayerProfile());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "cheche:gamekit-profile" || e.key?.endsWith("-best")) refresh();
    };
    const onProgress = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, onProgress);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(GAMEKIT_PROGRESS_EVENT, onProgress);
    };
  }, [refresh]);

  return { profile, refresh };
}
