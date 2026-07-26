import { describe, expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { GAMES } from "@/data/games";

describe("games catalog", () => {
  test("each game has ageBand and estMinutes", () => {
    for (const game of GAMES) {
      expect(["explore", "challenge"]).toContain(game.ageBand);
      expect(game.estMinutes).toBeGreaterThan(0);
    }
  });

  test("does not list retired car-star or car-mission games", () => {
    const ids = GAMES.map((game) => game.slug);
    const hrefs = GAMES.map((game) => game.href);

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

  test("includes universe map route in sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith("/adventures"))).toBe(true);
  });

  test("includes the shipped snowboard game route", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(GAMES.some((game) => game.slug === "snowboard")).toBe(true);
    expect(urls.some((url) => url.endsWith("/games/snowboard"))).toBe(true);
  });
});
