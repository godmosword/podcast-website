"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_FLY_MS } from "@/lib/universe/map-camera-utils";

/** flyTo no-op（未進入 isAnimating）時的收斂上限；略大於最長飛行時長。 */
const FLY_SETTLE_FALLBACK_MS = MAX_FLY_MS + 50;

type SheetReadyLatchOptions = {
  /** 與 UniverseMap `cameraTarget.key` 同源。 */
  targetKey: string;
  /** 目前是否為島路徑（世界層無 sheet）。 */
  onIsland: boolean;
  isAnimating: boolean;
  reducedMotion: boolean;
  /** viewport 已量測；深連結在 false 前不啟動 no-op fallback。 */
  isMeasured?: boolean;
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
  isMeasured = false,
}: SheetReadyLatchOptions): boolean {
  const [sheetReady, setSheetReady] = useState(() => {
    if (!onIsland) return true;
    return reducedMotion;
  });

  const prevTargetKeyRef = useRef(targetKey);
  const prevOnIslandRef = useRef(onIsland);
  const prevAnimatingRef = useRef(isAnimating);
  const isAnimatingRef = useRef(isAnimating);
  isAnimatingRef.current = isAnimating;

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

  // flyTo no-op（量測後 isAnimating 從未 true）：逾時且鏡頭靜止時收斂。
  useEffect(() => {
    if (reducedMotion || !onIsland || !isMeasured) return;
    const timer = window.setTimeout(() => {
      if (!isAnimatingRef.current) {
        setSheetReady(true);
      }
    }, FLY_SETTLE_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, [targetKey, onIsland, reducedMotion, isMeasured]);

  return sheetReady;
}
