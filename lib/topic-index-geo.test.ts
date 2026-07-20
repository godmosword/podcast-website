import { describe, expect, it } from "vitest";
import { allTags, getStoriesByTag } from "@/data/content";
import { topicIndexDefinitionSummary } from "./topic-index-geo";

describe("topicIndexDefinitionSummary", () => {
  it("含主題數與代表標籤", () => {
    const themes = allTags().map((tag) => ({
      tag,
      count: getStoriesByTag(tag).length,
    }));
    const summary = topicIndexDefinitionSummary(themes);

    expect(summary).toContain(String(themes.length));
    expect(summary).toContain(themes[0].tag);
  });
});
