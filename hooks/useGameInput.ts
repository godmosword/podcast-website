"use client";

import { useEffect, useRef } from "react";
import { InputManager } from "@/lib/gamekit/input";
import type { GameAction } from "@/lib/gamekit/types";

export type GameInputSnapshot = {
  isHeld: (action: GameAction) => boolean;
  wasPressed: (action: GameAction) => boolean;
  wasReleased: (action: GameAction) => boolean;
};

/**
 * 每幀輪詢鍵盤 + Gamepad，轉成統一 GameAction。
 * 觸控仍由各遊戲 UI 自行處理。
 */
export function useGameInput(
  onFrame: (input: GameInputSnapshot) => void,
  enabled = true,
) {
  const inputRef = useRef<InputManager | null>(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    if (!enabled) return;
    const input = new InputManager();
    inputRef.current = input;
    input.attach();

    let raf = 0;
    const tick = () => {
      input.poll();
      onFrameRef.current({
        isHeld: (a) => input.isHeld(a),
        wasPressed: (a) => input.wasPressed(a),
        wasReleased: (a) => input.wasReleased(a),
      });
      // 事件（keydown/inject）在兩幀之間累積，必須先讓回呼讀到再清除，
      // 否則鍵盤的 wasPressed 永遠不會成立。
      input.clearFrame();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      input.detach();
      inputRef.current = null;
    };
  }, [enabled]);
}
