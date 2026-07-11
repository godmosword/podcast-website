"use client";

import { useEffect, useMemo, useState } from "react";
import type { Character } from "@/data/characters";
import { computeRecognizedCharacterIds } from "@/lib/character-recognition";
import { getProgressSync, subscribeProgress } from "@/lib/progress-store";
import { useCompletedSlugs } from "@/hooks/useZoneProgress";

/**
 * 圖鑑已認識角色 id 集合。
 * SSR／hydration 前為空（全卡待認識），mount 後讀 progress-store。
 */
export function useRecognizedCharacterIds(
  characters: Character[],
): ReadonlySet<string> {
  const completedSlugs = useCompletedSlugs();
  const [unlockedIds, setUnlockedIds] = useState<readonly string[]>([]);

  useEffect(() => {
    const read = () => {
      setUnlockedIds(getProgressSync().unlocks.characters);
    };
    read();
    return subscribeProgress(read);
  }, []);

  return useMemo(
    () =>
      computeRecognizedCharacterIds(
        characters,
        completedSlugs,
        new Set(unlockedIds),
      ),
    [characters, completedSlugs, unlockedIds],
  );
}
