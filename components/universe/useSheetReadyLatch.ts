"use client";

import { useEffect, useRef, useState } from "react";

type SheetReadyLatchOptions = {
  /** 與 UniverseMap `cameraTarget.key` 同源。 */
  targetKey: string;
  /** 目前是否為島路徑（世界層無 sheet）。 */
  onIsland: boolean;
  isAnimating: boolean;
  reducedMotion: boolean;
};

/**
 * sheetReady 閂鎖：target key 改變立刻 false；reduced-motion 掛載即 true；
 * 否則等 isAnimating true→false 才 true（深連結 isMeasured 前亦保持 false）。
 */
export function useSheetReadyLatch({
  targetKey,
  onIsland,
  isAnimating,
  reducedMotion,
}: SheetReadyLatchOptions): boolean {
  const [sheetReady, setSheetReady] = useState(() => {
    if (!onIsland) return true;
    return reducedMotion;
  });

  const prevTargetKeyRef = useRef(targetKey);
  const prevOnIslandRef = useRef(onIsland);
  const prevAnimatingRef = useRef(isAnimating);

  // targetKey／onIsland 變更：同一 commit 即重置（避免 effect 首幀泄漏 sheetReady=true）
  if (
    prevTargetKeyRef.current !== targetKey ||
    prevOnIslandRef.current !== onIsland
  ) {
    prevTargetKeyRef.current = targetKey;
    prevOnIslandRef.current = onIsland;
    const nextReady = !onIsland || reducedMotion;
    if (sheetReady !== nextReady) {
      setSheetReady(nextReady);
    }
  }

  useEffect(() => {
    if (reducedMotion && onIsland) {
      setSheetReady(true);
    }
  }, [reducedMotion, onIsland]);

  useEffect(() => {
    const wasAnimating = prevAnimatingRef.current;
    prevAnimatingRef.current = isAnimating;
    if (reducedMotion || !onIsland) return;
    if (wasAnimating && !isAnimating) {
      setSheetReady(true);
    }
  }, [isAnimating, reducedMotion, onIsland]);

  return sheetReady;
}
