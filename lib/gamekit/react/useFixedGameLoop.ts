"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  GameLoop,
  type GameLoopCallbacks,
} from "@/lib/gamekit/runtime/loop";

/**
 * 固定時間步進迴圈（委派 lib/gamekit/loop），供 CarPlatformer 等 canvas 遊戲使用。
 */
export function useFixedGameLoop(
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
