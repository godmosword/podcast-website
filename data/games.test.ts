import { describe, expect, test } from "vitest";
import { CHALLENGE_PARENT_TIP, GAMES, gameParentTip } from "@/data/games";

describe("games parent tip (UX-P0-4)", () => {
  test("challenge 遊戲回傳家長陪同提示", () => {
    const challengeGames = GAMES.filter((game) => game.ageBand === "challenge");
    expect(challengeGames.length).toBeGreaterThan(0);

    for (const game of challengeGames) {
      expect(gameParentTip(game)).toBe(CHALLENGE_PARENT_TIP);
    }
  });

  test("explore 遊戲不回傳家長提示", () => {
    const exploreGames = GAMES.filter((game) => game.ageBand === "explore");
    expect(exploreGames.length).toBeGreaterThan(0);

    for (const game of exploreGames) {
      expect(gameParentTip(game)).toBeNull();
    }
  });
});
