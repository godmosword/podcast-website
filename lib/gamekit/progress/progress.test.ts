import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { vehiclesUnlockedAt, nextGarageUnlock } from "@/lib/gamekit/progress/garage";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import {
  loadPlayerProfile,
  recordBestScore,
  recordMedal,
} from "@/lib/gamekit/progress/save";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import {
  BLOCK_DROP_DIFFICULTIES,
  BLOCK_DROP_SPECIAL_MODES,
  loadGameKitSettings,
  saveGameKitSettings,
} from "@/lib/gamekit/progress/settings";

describe("gamekit progress meta", () => {
  it("medalFlags 與 medalCount", () => {
    const f = medalFlags(true, true, false);
    expect(f).toBe(3);
    expect(medalCount(f)).toBe(2);
  });
});

describe("gamekit progress save", () => {
  it("recordBestScore 只在新高分時更新", () => {
    const base = loadPlayerProfile();
    const next = recordBestScore(base, "block-drop", 100);
    expect(next.bests["block-drop"]).toBe(100);
    const same = recordBestScore(next, "block-drop", 50);
    expect(same.bests["block-drop"]).toBe(100);
  });

  it("recordMedal 合併三星 bit", () => {
    const base = loadPlayerProfile();
    const f1 = medalFlags(true, false, false);
    const f2 = medalFlags(false, true, true);
    let p = recordMedal(base, "candy-match", 0, f1);
    p = recordMedal(p, "candy-match", 0, f2);
    expect(medalCount(p.medals["candy-match"]?.[0] ?? 0)).toBe(3);
  });
});

describe("gamekit progress garage", () => {
  it("vehiclesUnlockedAt 依星星門檻", () => {
    expect(vehiclesUnlockedAt(0)).toEqual(["小黃"]);
    expect(vehiclesUnlockedAt(3)).toContain("怪獸卡車");
    expect(vehiclesUnlockedAt(15)).toContain("恐龍車多多");
  });

  it("nextGarageUnlock 回下一輛與剩餘星星", () => {
    expect(nextGarageUnlock(0)).toEqual({ name: "怪獸卡車", remaining: 3 });
    expect(nextGarageUnlock(3)).toEqual({ name: "小紅賽車", remaining: 3 });
    expect(nextGarageUnlock(15)).toBeNull();
  });
});

describe("gamekit progress settings", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
    };
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      localStorage: localStorageMock,
    });
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("預設開啟兒童模式", () => {
    expect(loadGameKitSettings().kidsMode).toBe(true);
  });

  it("kidsMode 可透過 saveGameKitSettings 切換", () => {
    saveGameKitSettings({ ...loadGameKitSettings(), kidsMode: false });
    const off = loadGameKitSettings();
    expect(off.kidsMode).toBe(false);
    saveGameKitSettings({ ...off, kidsMode: true });
  });

  it("繽紛方塊預設使用輕鬆難度與經典模式", () => {
    const settings = loadGameKitSettings();

    expect(BLOCK_DROP_DIFFICULTIES.map((d) => d.id)).toEqual([
      "relaxed",
      "standard",
      "challenge",
    ]);
    expect(BLOCK_DROP_SPECIAL_MODES.map((m) => m.id)).toEqual([
      "classic",
      "rainbow",
    ]);
    expect(settings.blockDropDifficulty).toBe("relaxed");
    expect(settings.blockDropSpecialMode).toBe("classic");
    expect(settings.gameVolume).toBe(1);
    expect(settings.motionPreference).toBe("system");
  });

  it("繽紛方塊難度與特殊模式可儲存", () => {
    saveGameKitSettings({
      ...loadGameKitSettings(),
      blockDropDifficulty: "challenge",
    });
    const hard = loadGameKitSettings();
    expect(hard.blockDropDifficulty).toBe("challenge");

    saveGameKitSettings({ ...hard, blockDropSpecialMode: "rainbow" });
    const rainbow = loadGameKitSettings();
    expect(rainbow.blockDropDifficulty).toBe("challenge");
    expect(rainbow.blockDropSpecialMode).toBe("rainbow");

    saveGameKitSettings({ ...rainbow, gameVolume: 0.35 });
    expect(loadGameKitSettings().gameVolume).toBe(0.35);

    saveGameKitSettings({
      ...rainbow,
      blockDropDifficulty: "relaxed",
      blockDropSpecialMode: "classic",
    });
  });
});

describe("gamekit progress session", () => {
  it("reportGameSession 通關發星與貼紙", () => {
    const cleared = reportGameSession({
      gameId: "candy-match",
      score: 500,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
    expect(cleared.gamesPlayed["candy-match"]).toBe(true);
    expect(cleared.stickers).toContain("played-candy-match");
    expect(cleared.stars).toBeGreaterThan(0);
    expect(medalCount(cleared.medals["candy-match"]?.[0] ?? 0)).toBeGreaterThan(0);
    expect(cleared.bests["candy-match"]).toBe(500);
  });
});
