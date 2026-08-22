import { describe, expect, it } from "vitest";
import { CANDY_MATCH_LEVELS } from "./levels";
import {
  CANDY_CURATED_CHALLENGE_POOL,
  applyCandyChallenge,
  isCandyChallengeFeasible,
  selectCandyChallenge,
} from "./challenges";

describe("Candy curated challenge pool", () => {
  it("每個既有關卡都有可完成的整理過挑戰", () => {
    for (const level of CANDY_MATCH_LEVELS) {
      const pool = CANDY_CURATED_CHALLENGE_POOL[level.index] ?? [];
      expect(pool.length).toBeGreaterThan(1);
      expect(pool.every((challenge) => isCandyChallengeFeasible(level, challenge))).toBe(true);
    }
  });

  it("選擇時避免 immediate repeat，且套用後不污染地圖基準資料", () => {
    const base = CANDY_MATCH_LEVELS[2]!;
    const first = selectCandyChallenge(2, undefined, () => 0);
    const second = selectCandyChallenge(2, first.id, () => 0);
    expect(second.id).not.toBe(first.id);

    const configured = applyCandyChallenge(base, first);
    expect(configured.challengeId).toBe(first.id);
    expect(configured.task).not.toBe(base.task);
    expect(CANDY_MATCH_LEVELS[2]!.challengeId).toBeUndefined();
  });

  it("selection 是 deterministic，可在測試中注入 RNG", () => {
    expect(selectCandyChallenge(0, undefined, () => 0).id).toBe("warmup-waves-3");
    expect(selectCandyChallenge(0, undefined, () => 0.99).id).toBe("warmup-waves-5");
  });
});
