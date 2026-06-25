import { describe, expect, it } from "vitest";
import { getStory, getStories, storiesByNewest } from "./content";

describe("story content", () => {
  it("contains manual and Apple-synced stories", () => {
    const stories = getStories();
    expect(stories.length).toBeGreaterThanOrEqual(11);
    expect(stories.every((story) => story.kind === "story")).toBe(true);
  });

  it("enriches manual stories with reflection prompts", () => {
    expect(getStory("ep-6")?.reflectionPrompt?.child).toContain("幫忙");
  });

  it("resolves canonical and legacy slugs", () => {
    expect(getStory("ep-1")?.title).toContain("電動車");
    expect(getStory("ev")?.slug).toBe("ep-1");
  });

  it("sorts newest first", () => {
    const sorted = storiesByNewest();
    expect(sorted[0].ep).toBeGreaterThanOrEqual(sorted[1]?.ep ?? 0);
  });
});
