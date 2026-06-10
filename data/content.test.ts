import { describe, expect, it } from "vitest";
import {
  getAllContent,
  getStories,
  getStory,
  storiesByNewest,
} from "./content";
import { getStories as legacyStories } from "./content";

describe("content union", () => {
  it("getAllContent returns only stories for now", () => {
    const all = getAllContent();
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((c) => c.kind === "story")).toBe(true);
  });

  it("getStories is stable across calls", () => {
    expect(getStories().map((s) => s.slug)).toEqual(
      legacyStories().map((s) => s.slug),
    );
  });

  it("storiesByNewest sorts by ep descending", () => {
    const sorted = storiesByNewest();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].ep).toBeGreaterThanOrEqual(sorted[i].ep);
    }
  });

  it("enriches characterIds from characters registry", () => {
    const story = getStory("ambulance");
    expect(story?.characterIds).toContain("an-an");
  });

  it("getStory finds by slug", () => {
    expect(getStory("ev")?.title).toContain("電動車");
  });
});
