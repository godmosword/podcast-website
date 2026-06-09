"use client";

import { useEffect, useRef, type RefObject } from "react";
import { GameLoop, type GameLoopCallbacks } from "@/lib/gamekit/loop";

/**
 * React 生命週期綁定的固定步進迴圈（Phase 8）。
 * 邏輯 120Hz、渲染 60fps 插值。
 */
export function useGameLoop(
  callbacks: GameLoopCallbacks,
  enabled = true,
): RefObject<GameLoop> {
  const loopRef = useRef<GameLoop>(new GameLoop());
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!enabled) {
      loopRef.current.stop();
      return;
    }

    const loop = loopRef.current;
    loop.start({
      fixedUpdate: (dt) => callbacksRef.current.fixedUpdate(dt),
      render: (alpha) => callbacksRef.current.render(alpha),
      frame: () => callbacksRef.current.frame?.(),
    });

    return () => loop.stop();
  }, [enabled]);

  return loopRef;
}
