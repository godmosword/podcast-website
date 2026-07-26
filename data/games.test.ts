import { describe, expect, test } from "vitest";
import {
  CHALLENGE_PARENT_TIP,
  GAME_NEXT,
  GAMES,
  gameParentTip,
  getNextGame,
} from "@/data/games";

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

  test("家長提示文案溫柔、非警告口吻", () => {
    expect(CHALLENGE_PARENT_TIP).toBe("爸媽陪玩更有趣");
  });
});

describe("games v2 presentation metadata", () => {
  test("每款遊戲都有入口視覺、類型、操作提示與短 teaser", () => {
    for (const game of GAMES) {
      expect(["match", "adventure", "blocks", "racing", "coloring"]).toContain(
        game.gameType,
      );
      expect(game.controls.length).toBeGreaterThanOrEqual(2);
      expect(game.art.cover).toMatch(/^\/games\/v2\//);
      expect(game.art.alt.length).toBeGreaterThan(0);
      expect(game.teaser.length).toBeGreaterThan(0);
      expect(game.teaser.length).toBeLessThanOrEqual(14);
    }
  });

  test("只有繽紛消消樂是入口主打遊戲", () => {
    expect(GAMES.filter((game) => game.featured).map((game) => game.slug)).toEqual([
      "candy-match",
    ]);
  });
});

describe("games next-station flow", () => {
  test("GAME_NEXT 涵蓋全部遊戲且指向存在的 slug", () => {
    expect(Object.keys(GAME_NEXT).sort()).toEqual(
      GAMES.map((game) => game.slug).sort(),
    );
    for (const [from, to] of Object.entries(GAME_NEXT)) {
      expect(GAMES.some((game) => game.slug === from)).toBe(true);
      expect(GAMES.some((game) => game.slug === to)).toBe(true);
      expect(from).not.toBe(to);
    }
  });

  test("getNextGame 回傳正確下一站", () => {
    expect(getNextGame("candy-match")?.slug).toBe("coloring-book");
    expect(getNextGame("block-drop")?.slug).toBe("candy-kart");
    expect(getNextGame("nope")).toBeNull();
  });
});
