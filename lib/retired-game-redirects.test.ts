import { describe, expect, it } from "vitest";
import { GAMES } from "@/data/games";
import {
  RETIRED_GAME_SLUGS,
  retiredGameRedirects,
} from "./retired-game-redirects";

describe("retiredGameRedirects", () => {
  it("每個退役 slug 都永久導向 /games", () => {
    const rules = retiredGameRedirects();
    expect(rules).toHaveLength(RETIRED_GAME_SLUGS.length);
    for (const slug of RETIRED_GAME_SLUGS) {
      expect(rules).toContainEqual({
        source: `/games/${slug}`,
        destination: "/games",
        permanent: true,
      });
    }
  });

  it("退役 slug 不得與現役遊戲重疊（否則會遮蔽活著的路由）", () => {
    const live = new Set(GAMES.map((game) => game.slug));
    for (const slug of RETIRED_GAME_SLUGS) {
      expect(live.has(slug)).toBe(false);
    }
  });
});
