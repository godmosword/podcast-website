import { useCallback, useEffect, useState } from "react";

export function useBestScore(storageKey: string) {
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw != null) {
        const n = Number(raw);
        if (Number.isFinite(n)) setBest(n);
      }
    } catch {
      // localStorage 不可用時略過
    }
  }, [storageKey]);

  const saveBest = useCallback(
    (score: number) => {
      setBest((prev) => {
        if (prev != null && score <= prev) return prev;
        try {
          window.localStorage.setItem(storageKey, String(score));
        } catch {
          // 略過
        }
        return score;
      });
    },
    [storageKey],
  );

  return [best, saveBest] as const;
}
