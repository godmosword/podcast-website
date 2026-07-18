import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import { migrateV2ToV3 } from "@/lib/gamekit/progress/economy";
import { vehiclesUnlockedAt } from "@/lib/gamekit/progress/garage";
import {
  loadPlayerProfile,
  recordBestScore,
  recordMedal,
} from "@/lib/gamekit/progress/save";
import { reportGameSession } from "@/lib/gamekit/progress/session";
import type { PlayerProfile } from "@/lib/gamekit/types";

/**
 * GameKit 進度契約鎖定（blueprint S0 安全網）。
 *
 * 供 car-adventure Phase 2/3（三星 display-only、能力系統）擴充前把現況鎖死。
 * 這些不變量若被非預期改動即紅，直接對應 blueprint 決策 D1/D2：
 * - 獎牌為 3-bit 飽和；時間星不得加成第 4 個 medal bit（會位移車輛解鎖門檻）。
 * - 存檔 migration 以 spread 保留未知欄位；v3→v4 只可新增欄位、不改既有。
 */

function useMockStore() {
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
}

describe("契約：獎牌為 3-bit 飽和（D1，時間星不得成第 4 bit）", () => {
  it("medalFlags 只用 bit0/1/2；全開＝7、medalCount＝3", () => {
    expect(medalFlags(true, true, true)).toBe(7);
    expect(medalFlags(true, false, false)).toBe(1);
    expect(medalFlags(false, true, false)).toBe(2);
    expect(medalFlags(false, false, true)).toBe(4);
    expect(medalCount(7)).toBe(3);
  });

  it("medalCount 不計第 4 bit（bit3=8）——加時間星到 medal 需先重寫此契約", () => {
    // 若未來把「時間達標」硬塞成第 4 個 medal bit，此斷言會逼迫同步改 medalCount，
    // 提醒授星迴圈上界 bit<=4 與車輛解鎖門檻會一起位移（見 D1，故禁止）。
    expect(medalCount(7 | 8)).toBe(3);
    expect(medalCount(8)).toBe(0);
  });
});

describe("契約：reportGameSession 每新 bit 授 1 星、car-adventure 上限 3 星（D1）", () => {
  useMockStore();

  it("通關＋無傷＋全收＝3 星、medalCount＝3", () => {
    const p = reportGameSession({
      gameId: "car-adventure",
      score: 100,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
    expect(p.stars).toBe(3);
    expect(medalCount(p.medals["car-adventure"]?.[0] ?? 0)).toBe(3);
  });

  it("重複回報同一關同旗標不再加星（每 bit 一次性）", () => {
    reportGameSession({
      gameId: "car-adventure",
      score: 100,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
    const again = reportGameSession({
      gameId: "car-adventure",
      score: 120,
      levelIndex: 0,
      cleared: true,
      flawless: true,
      collectedAll: true,
    });
    expect(again.stars).toBe(3);
  });

  it("只通關＝1 星（單 bit）", () => {
    const p = reportGameSession({
      gameId: "car-adventure",
      score: 80,
      levelIndex: 0,
      cleared: true,
    });
    expect(p.stars).toBe(1);
    expect(medalCount(p.medals["car-adventure"]?.[0] ?? 0)).toBe(1);
  });
});

describe("契約：存檔 migration 保留未知欄位（D2，v3→v4 只可加欄位）", () => {
  it("migrateV2ToV3 建立 economy、保留 stars 與未知欄位", () => {
    const legacy = {
      version: 2,
      stars: 5,
      unlockedVehicles: ["小黃"],
      bests: {},
      medals: {},
      stickers: [],
      gamesPlayed: {},
      // 模擬「未來版本欄位」（如 S5 的 adventureStars）：migration 不得丟棄
      adventureStars: { 0: 3 },
    } as unknown as Partial<PlayerProfile>;

    const migrated = migrateV2ToV3(legacy);
    expect(migrated.version).toBe(3);
    expect(migrated.economy).toBeDefined();
    expect(migrated.stars).toBe(5);
    expect(migrated.economy?.lifetimeStars).toBe(5);
    expect((migrated as Record<string, unknown>).adventureStars).toEqual({ 0: 3 });
  });
});

describe("契約：profile 更新以 spread 保留未知欄位", () => {
  it("recordMedal／recordBestScore 不丟未知欄位", () => {
    const base = {
      ...loadPlayerProfile(),
      futureField: "keep-me",
    } as unknown as PlayerProfile;
    let p = recordBestScore(base, "car-adventure", 999);
    p = recordMedal(p, "car-adventure", 0, medalFlags(true, false, false));
    expect((p as Record<string, unknown>).futureField).toBe("keep-me");
    expect(p.bests["car-adventure"]).toBe(999);
  });
});

describe("契約：車輛解鎖門檻不得漂移（D1 佐證——adventureStars 不可餵 lifetimeStars）", () => {
  it("vehiclesUnlockedAt 門檻快照", () => {
    expect(vehiclesUnlockedAt(0)).toEqual(["小黃"]);
    expect(vehiclesUnlockedAt(3)).toEqual(["小黃", "怪獸卡車"]);
    expect(vehiclesUnlockedAt(6)).toEqual(["小黃", "怪獸卡車", "小紅賽車"]);
    expect(vehiclesUnlockedAt(10)).toEqual([
      "小黃",
      "怪獸卡車",
      "小紅賽車",
      "安安救護車",
    ]);
    expect(vehiclesUnlockedAt(15)).toEqual([
      "小黃",
      "怪獸卡車",
      "小紅賽車",
      "安安救護車",
      "恐龍車多多",
    ]);
  });
});
