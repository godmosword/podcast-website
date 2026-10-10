import { beforeEach, describe, expect, it, vi } from "vitest";
import { GAME_NEXT, GAMES } from "@/data/games";
import { localDateKey, readActivityLog, recordGameSession } from "@/lib/activity-log";
import { buildParentDashboardSnapshot } from "@/lib/for-parents/dashboard";
import { DEFAULT_PROGRESS } from "@/lib/progress-store";
import { stickerLabel } from "@/lib/gamekit/progress/stickers";
import { GAMEKIT_GAME_IDS } from "@/lib/gamekit/types";

/**
 * 新增 Game Kit 遊戲時，TS 只會強制補 Record<GameKitGameId, …>；
 * 下面這些手寫名單漏加不會編譯失敗，只會靜默失效（活動不記錄、儀表板缺列、貼紙顯示英文 id）。
 */
describe("Game Kit 遊戲 id 名單", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
      removeItem: (key: string) => void store.delete(key),
      clear: () => store.clear(),
    };
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      localStorage: storage,
    });
    vi.stubGlobal("localStorage", storage);
  });

  it.each(GAMEKIT_GAME_IDS)("%s 在遊戲目錄、下一站環裡", (id) => {
    expect(GAMES.some((g) => g.slug === id)).toBe(true);
    expect(GAME_NEXT[id]).toBeDefined();
    expect(Object.values(GAME_NEXT)).toContain(id);
  });

  it.each(GAMEKIT_GAME_IDS)("%s 有「玩過」貼紙的中文名", (id) => {
    expect(stickerLabel(`played-${id}`)).not.toBe(`played-${id}`);
  });

  it.each(GAMEKIT_GAME_IDS)("%s 的結算會寫進活動紀錄", (id) => {
    const at = new Date(2026, 9, 10, 12).getTime();
    recordGameSession(id, true, at);
    expect(readActivityLog(at).days[localDateKey(at)]?.games[id]).toMatchObject({
      sessions: 1,
      clears: 1,
    });
  });

  it("家長儀表板每款遊戲各一列", () => {
    const ids = buildParentDashboardSnapshot(DEFAULT_PROGRESS).games.map((g) => g.gameId);
    expect([...ids].sort()).toEqual([...GAMEKIT_GAME_IDS].sort());
  });
});
