import { describe, expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { GAMES } from "@/data/games";
import { GAMES as CATALOG_GAMES } from "@/lib/games/catalog";

describe("games catalog", () => {
  test("each game has ageBand and estMinutes", () => {
    for (const game of GAMES) {
      expect(["explore", "challenge"]).toContain(game.ageBand);
      expect(game.estMinutes).toBeGreaterThan(0);
    }
  });

  test("catalog re-exports slug as id", () => {
    expect(CATALOG_GAMES.every((g) => g.id === g.slug)).toBe(true);
  });

  test("does not list retired car-star or car-mission games", () => {
    const ids = CATALOG_GAMES.map((game) => game.id);
    const hrefs = CATALOG_GAMES.map((game) => game.href);

    expect(ids).not.toContain("car-star");
    expect(ids).not.toContain("car-mission");
    expect(hrefs).not.toContain("/games/car-star");
    expect(hrefs).not.toContain("/games/car-mission");
  });

  test("does not expose retired game routes in sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);

    expect(urls.some((url) => url.endsWith("/games/car-star"))).toBe(false);
    expect(urls.some((url) => url.endsWith("/games/car-mission"))).toBe(false);
  });
});
