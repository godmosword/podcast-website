import type { GameKitGameId } from "./types";
import { getGameSheet, type SheetId } from "./procedural-sheets";

/** 各款遊戲啟動前需暖機的程序生成 sheet。 */
export const GAME_PRELOAD_SHEETS: Record<GameKitGameId, SheetId[]> = {
  "car-star": ["tiles-common", "car-topdown", "star-icon"],
  "car-mission": ["truck-mission", "firefly"],
  "car-adventure": ["tiles-common"],
  "block-drop": ["blocks-drop"],
};

const warmed = new Set<string>();

function warmSheet(id: SheetId): void {
  if (warmed.has(id)) return;
  getGameSheet(id);
  warmed.add(id);
}

/** 同步暖機單款所需 sheet（瀏覽器環境）。 */
export function preloadGameAssetsSync(gameId: GameKitGameId): void {
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

/** 遊樂園 hub 可選：一次暖機四款共用 sheet。 */
export function preloadAllGameAssets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const ids = new Set<SheetId>();
  for (const sheets of Object.values(GAME_PRELOAD_SHEETS)) {
    for (const id of sheets) ids.add(id);
  }
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      for (const id of ids) warmSheet(id);
      resolve();
    });
  });
}

export function isGameAssetsReady(gameId: GameKitGameId): boolean {
  return GAME_PRELOAD_SHEETS[gameId].every((id) => warmed.has(id));
}

/** 測試用：重設暖機快取。 */
export function resetPreloadCacheForTests(): void {
  warmed.clear();
}
