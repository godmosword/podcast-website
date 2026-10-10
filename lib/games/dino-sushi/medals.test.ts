import { describe, expect, it } from "vitest";
import { medalCount, medalFlags } from "@/lib/gamekit/progress/meta";
import { DINO_SUSHI_LEVEL_INDEX, roundMedals } from "./medals";

function stars(firstTries: boolean[]): number {
  const m = roundMedals(firstTries);
  return medalCount(medalFlags(m.cleared, m.flawless, m.collectedAll));
}

describe("星星（medal bit 是相容性契約）", () => {
  it("levelIndex 固定 0：這款遊戲終身最多 3 星", () => {
    expect(DINO_SUSHI_LEVEL_INDEX).toBe(0);
  });

  it("送完 5 單 ★；至少 3 單一次做對 ★★；5 單都一次做對 ★★★", () => {
    expect(stars([false, false, false, false, false])).toBe(1);
    expect(stars([true, true, false, false, false])).toBe(1);
    expect(stars([true, false, true, false, true])).toBe(2);
    expect(stars([true, true, true, true, false])).toBe(2);
    expect(stars([true, true, true, true, true])).toBe(3);
  });

  it("bit 對應：bit0 送完、bit1 至少 3 單、bit2 全部一次做對", () => {
    expect(roundMedals([true, true, true, false, false])).toEqual({
      cleared: true,
      flawless: true,
      collectedAll: false,
      firstTryCount: 3,
    });
  });

  it("沒送完 5 單不算通關", () => {
    expect(roundMedals([true, true, true, true])).toMatchObject({
      cleared: false,
      flawless: false,
      collectedAll: false,
    });
  });
});
