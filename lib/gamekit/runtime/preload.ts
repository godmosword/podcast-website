import type { GameKitGameId } from "../types";
import { getGameSheet, type SheetId } from "./procedural-sheets";

/** 各款遊戲啟動前需暖機的程序生成 sheet。 */
const GAME_PRELOAD_SHEETS: Record<GameKitGameId, SheetId[]> = {
  "block-drop": ["blocks-drop"],
  // candy-match 全 SVG/DOM 繪製，無程序生成 sheet
  "candy-match": [],
};

const warmed = new Set<string>();

function warmSheet(id: SheetId): void {
  if (warmed.has(id)) return;
  getGameSheet(id);
  warmed.add(id);
}

/** 同步暖機單款所需 sheet（瀏覽器環境）。 */
function preloadGameAssetsSync(gameId: GameKitGameId): void {
  if (typeof window === "undefined") return;
  for (const sheetId of GAME_PRELOAD_SHEETS[gameId]) {
    warmSheet(sheetId);
  }
}

/** 讓出主執行緒後預載，避免阻塞首次繪製。 */
export function preloadGameAssets(gameId: GameKitGameId): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const run = () => {
      preloadGameAssetsSync(gameId);
      resolve();
    };
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(() => run(), { timeout: 120 });
    } else {
      requestAnimationFrame(() => run());
    }
  });
}

export function isGameAssetsReady(gameId: GameKitGameId): boolean {
  return GAME_PRELOAD_SHEETS[gameId].every((id) => warmed.has(id));
}
