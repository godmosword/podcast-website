import { describe, expect, it } from "vitest";
import { getAllContent, getStory, getStories, storiesByNewest } from "./content";

describe("content union", () => {
  it("getAllContent 包含手動與 Apple 同步故事", () => {
    const all = getAllContent();
    expect(all.length).toBeGreaterThanOrEqual(11);
    expect(all.every((c) => c.kind === "story")).toBe(true);
  });

  it("getStories 與 getAllContent 故事數一致", () => {
    expect(getStories().length).toBe(getAllContent().length);
  });
});

describe("getStory enrichment", () => {
  it("手動故事帶 reflectionPrompt", () => {
    const story = getStory("ep-6");
    expect(story?.reflectionPrompt?.child).toContain("幫忙");
  });

  it("EP1 標題正確", () => {
    expect(getStory("ep-1")?.title).toContain("電動車");
    expect(getStory("ev")?.slug).toBe("ep-1");
  });
});

describe("storiesByNewest", () => {
  it("最新集在第一筆", () => {
    const sorted = storiesByNewest();
    expect(sorted[0].ep).toBeGreaterThanOrEqual(sorted[1]?.ep ?? 0);
  });
});
