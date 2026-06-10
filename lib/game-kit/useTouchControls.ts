"use client";

import { useGameInput, type GameInputSnapshot } from "@/hooks/useGameInput";
import {
  GridTouchButton,
  BarTouchButton,
  touchControlStyles,
} from "./TouchControls";

export type { GameInputSnapshot };

/**
 * 統一觸控 layout 樣式與鍵盤/手把輪詢；虛擬鍵內建 ≥44×44px 觸控目標。
 */
export function useTouchControls() {
  return {
    styles: touchControlStyles,
    GridButton: GridTouchButton,
    BarButton: BarTouchButton,
    useKeyboardInput: useGameInput,
  };
}
