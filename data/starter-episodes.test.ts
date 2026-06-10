import { describe, expect, it } from "vitest";
import { getStory } from "./content";
import { STARTER_EPISODE_SLUGS } from "./starter-episodes";

describe("starter episodes", () => {
  it("all starter slugs resolve to stories", () => {
    for (const slug of STARTER_EPISODE_SLUGS) {
      expect(getStory(slug)?.slug).toBe(slug);
    }
  });
});
