// @vitest-environment jsdom
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { candyModeMedals } from "./candy-match-medals";
import { reportGameSession } from "./session";
import { loadPlayerProfile, savePlayerProfile } from "./save";

beforeEach(() => {
  const store = new Map<string, string>();
  const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) };
  Object.defineProperty(window, "localStorage", { value: storage, configurable: true });
  vi.stubGlobal("localStorage", storage);
});
afterEach(() => vi.unstubAllGlobals());
const win = (mode: "easy" | "challenge", flawless = true, collectedAll = true) => reportGameSession({
  gameId: "candy-match", candyMode: mode, score: 100, cleared: true, levelIndex: 0, flawless, collectedAll,
});

describe("消消樂模式成就", () => {
  it("舊獎章歸入輕鬆，挑戰沒有被解鎖，分流後重載仍保留", () => {
    const profile = loadPlayerProfile();
    savePlayerProfile({ ...profile, stars: 9, economy: { lifetimeStars: 9, balance: 9, ledger: [] }, medals: { "candy-match": [7, 3] } });
    expect(candyModeMedals(loadPlayerProfile(), "easy")).toEqual([7, 3]);
    expect(candyModeMedals(loadPlayerProfile(), "challenge")).toEqual([]);
    const hard = win("challenge", false, false);
    expect(candyModeMedals(hard, "easy")).toEqual([7, 3]);
    expect(candyModeMedals(loadPlayerProfile(), "challenge")).toEqual([1]);
    expect(hard.stars).toBe(10);
    expect(win("challenge", false, false).stars).toBe(10);
    expect(win("easy").stars).toBe(10); // 舊獎章不重複發星
  });

  it("兩個模式獨立累積與發星，同一條件只領一次", () => {
    expect(win("easy", true, false).stars).toBe(2);
    expect(win("challenge", false, true).stars).toBe(4);
    const easy = win("easy", false, true);
    expect(candyModeMedals(easy, "easy")).toEqual([7]);
    expect(candyModeMedals(easy, "challenge")).toEqual([5]);
    expect(easy.stars).toBe(5);
    expect(win("easy").stars).toBe(5);
    expect(win("challenge").stars).toBe(6);
    expect(win("challenge").stars).toBe(6);
  });
});
