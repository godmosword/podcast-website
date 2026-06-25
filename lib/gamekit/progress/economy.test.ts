import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LEDGER_MAX,
  MIGRATED_V2_LEDGER_ID,
  applyGrantStars,
  applySpendStars,
  createEmptyEconomy,
  getLifetimeStars,
  migrateV2ToV3,
} from "./economy";
import type { PlayerProfile } from "../types";

function baseProfile(overrides: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    version: 3,
    stars: 0,
    economy: createEmptyEconomy(),
    unlockedVehicles: ["小黃"],
    bests: {},
    medals: {},
    stickers: [],
    gamesPlayed: {},
    ...overrides,
  };
}

describe("economy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));
  });

  it("migrateV2ToV3 將 stars 寫入帳本", () => {
    const migrated = migrateV2ToV3({
      version: 2,
      stars: 8,
      unlockedVehicles: ["小黃"],
      bests: {},
      medals: {},
      stickers: [],
      gamesPlayed: {},
    });

    expect(migrated.version).toBe(3);
    expect(migrated.economy?.lifetimeStars).toBe(8);
    expect(migrated.economy?.balance).toBe(8);
    expect(migrated.stars).toBe(8);
    expect(migrated.economy?.ledger).toHaveLength(1);
    expect(migrated.economy?.ledger[0]).toMatchObject({
      id: MIGRATED_V2_LEDGER_ID,
      amount: 8,
      source: "system:migrated-v2",
    });
  });

  it("migrateV2ToV3 冪等不重複遷移帳目", () => {
    const once = migrateV2ToV3({ version: 2, stars: 5 } as PlayerProfile);
    const twice = migrateV2ToV3(once);
    expect(twice.economy?.ledger.filter((e) => e.id === MIGRATED_V2_LEDGER_ID)).toHaveLength(1);
  });

  it("grantStars 冪等", () => {
    const p = baseProfile();
    const first = applyGrantStars(p, {
      id: "test:grant:1",
      amount: 3,
      source: "test",
    });
    const second = applyGrantStars(first, {
      id: "test:grant:1",
      amount: 3,
      source: "test",
    });
    expect(getLifetimeStars(second)).toBe(3);
    expect(second.economy?.ledger).toHaveLength(1);
  });

  it("spendStars 餘額不足不拋錯", () => {
    const p = applyGrantStars(baseProfile(), {
      id: "seed",
      amount: 2,
      source: "test",
    });
    const result = applySpendStars(p, {
      id: "spend:fail",
      amount: -5,
      source: "shop",
    });
    expect(result.ok).toBe(false);
    expect(result.profile.economy?.balance).toBe(2);
    expect(result.profile.economy?.ledger).toHaveLength(1);
  });

  it("spendStars 成功扣款且 lifetimeStars 不減", () => {
    const p = applyGrantStars(baseProfile(), {
      id: "seed",
      amount: 10,
      source: "test",
    });
    const result = applySpendStars(p, {
      id: "spend:ok",
      amount: -4,
      source: "shop",
    });
    expect(result.ok).toBe(true);
    expect(result.profile.economy?.lifetimeStars).toBe(10);
    expect(result.profile.economy?.balance).toBe(6);
  });

  it("ledger 上限 200 筆", () => {
    let p = baseProfile();
    for (let i = 0; i < LEDGER_MAX + 5; i += 1) {
      p = applyGrantStars(p, {
        id: `grant:${i}`,
        amount: 1,
        source: "test",
      });
    }
    expect(p.economy?.ledger.length).toBe(LEDGER_MAX);
    expect(p.economy?.ledger[0]?.id).toBe("grant:5");
  });

  it("grantStars 同步解鎖車庫", () => {
    const p = applyGrantStars(baseProfile(), {
      id: "garage-unlock",
      amount: 6,
      source: "test",
    });
    expect(p.unlockedVehicles).toContain("怪獸卡車");
    expect(p.unlockedVehicles).toContain("小紅賽車");
  });
});
