import { describe, expect, it } from "vitest";
import { HOME_SECTION_IDS } from "./home-sections";

describe("home-sections", () => {
  it("contains only the three rendered homepage sections", () => {
    expect(HOME_SECTION_IDS).toEqual([
      "latestHero",
      "favorites",
      "storyFilter",
    ]);
  });
});
