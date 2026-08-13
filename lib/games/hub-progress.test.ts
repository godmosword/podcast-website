import { describe, expect, it } from "vitest";
import { createEmptyEconomy } from "@/lib/gamekit/progress/economy";
import { SAVE_VERSION } from "@/lib/gamekit/progress/save";
import type { PlayerProfile } from "@/lib/gamekit/types";
import { emptyHubSnapshot, hubProgressFromProfile, hubProgressLabel } from "./hub-progress";

function profile(partial: Partial<PlayerProfile> = {}): PlayerProfile {
  return {
    version: SAVE_VERSION,
    stars: 0,
    economy: createEmptyEconomy(),
    unlockedVehicles: ["小黃"],
    bests: {},
    medals: {},
    stickers: [],
    gamesPlayed: {},
    ...partial,
  };
}

describe("hubProgressFromProfile", () => {
  it("無進度時不崩潰，文案仍溫柔", () => {
    const snap = hubProgressFromProfile(profile(), false);
    expect(snap.stars).toBe(0);
    expect(snap.playedCount).toBe(0);
    expect(snap.totalGames).toBe(3);
    expect(hubProgressLabel(snap)).toContain("收集了 0 顆星星");
    expect(hubProgressLabel(snap)).toContain("怪獸卡車");
    expect(snap.vehicles).toHaveLength(5);
    expect(snap.vehicles[0]?.unlocked).toBe(true);
    expect(snap.vehicles[1]?.unlocked).toBe(false);
    expect(snap.stickerLabels).toEqual([]);
    expect(emptyHubSnapshot().vehicles).toHaveLength(5);
  });

  it("著色本機草稿算已玩、不依賴 gamesPlayed", () => {
    const snap = hubProgressFromProfile(
      profile({
        stars: 3,
        economy: { lifetimeStars: 3, balance: 3, ledger: [] },
        gamesPlayed: { "candy-match": true },
        stickers: ["played-candy-match"],
      }),
      true,
    );
    expect(snap.playedSlugs).toEqual(["candy-match", "coloring-book"]);
    expect(snap.playedCount).toBe(2);
    expect(snap.nextUnlock?.name).toBe("小紅賽車");
    expect(snap.vehicles.filter((v) => v.unlocked).map((v) => v.name)).toEqual([
      "小黃",
      "怪獸卡車",
    ]);
    expect(snap.stickerLabels).toEqual(["玩過繽紛消消樂"]);
  });
});
