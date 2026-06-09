import { describe, expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { GAMES } from "@/lib/games/catalog";

describe("games catalog", () => {
  test("does not list retired car-star or car-mission games", () => {
    const ids = GAMES.map((game) => game.id);
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
});
