import { describe, expect, it } from "vitest";
import {
  canonicalStorySlug,
  legacyStoryRedirects,
  LEGACY_STORY_SLUG_ALIASES,
} from "./story-slug-aliases";

describe("story slug aliases", () => {
  it("maps legacy slugs to ep-N", () => {
    expect(canonicalStorySlug("ev")).toBe("ep-1");
    expect(canonicalStorySlug("ambulance")).toBe("ep-6");
    expect(canonicalStorySlug("ep-9")).toBe("ep-9");
  });

  it("generates detail and play redirects", () => {
    const redirects = legacyStoryRedirects();
    expect(redirects).toHaveLength(
      Object.keys(LEGACY_STORY_SLUG_ALIASES).length * 2,
    );
    expect(redirects).toContainEqual({
      source: "/story/ev",
      destination: "/story/ep-1",
      permanent: true,
    });
  });
});
