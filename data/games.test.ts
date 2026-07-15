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

describe("games v2 presentation metadata", () => {
  test("每款遊戲都有入口視覺、類型與操作提示", () => {
    for (const game of GAMES) {
      expect(["match", "adventure", "blocks", "racing", "coloring"]).toContain(
        game.gameType,
      );
      expect(game.controls.length).toBeGreaterThanOrEqual(2);
      expect(game.art.cover).toMatch(/^\/games\/v2\//);
      expect(game.art.alt.length).toBeGreaterThan(0);
    }
  });

  test("只有繽紛消消樂是入口主打遊戲", () => {
    expect(GAMES.filter((game) => game.featured).map((game) => game.slug)).toEqual([
      "candy-match",
    ]);
  });
});
