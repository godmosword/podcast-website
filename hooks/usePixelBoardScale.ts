"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeIntegerScale,
  viewportFor,
  type GameKitGameId,
} from "@/lib/gamekit";

export type PixelBoardLayout = {
  scale: number;
  displayWidth: number;
  displayHeight: number;
  offsetX: number;
  offsetY: number;
};

/**
 * DOM 棋盤／版面：以 native 像素尺寸整數倍放大至容器（Phase 1）。
 */
export function usePixelBoardScale(
  gameId: GameKitGameId,
  nativeWidth: number,
  nativeHeight: number,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PixelBoardLayout>({
    scale: 1,
    displayWidth: nativeWidth,
    displayHeight: nativeHeight,
    offsetX: 0,
    offsetY: 0,
  });

  const viewport = viewportFor(gameId);

  const remeasure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = computeIntegerScale(
      { width: nativeWidth, height: nativeHeight },
      rect.width,
      rect.height,
    );
    setLayout(next);
  }, [nativeWidth, nativeHeight]);

  useEffect(() => {
    remeasure();
    const el = containerRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(remeasure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [remeasure]);

  return { containerRef, layout, viewport };
}
