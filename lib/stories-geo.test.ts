import { describe, expect, it } from "vitest";
import { allTags, allVehicles, storiesByNewest } from "@/data/content";
import { storiesCatalogSummary } from "./stories-geo";

describe("storiesCatalogSummary", () => {
  it("含故事總數與篩選維度", () => {
    const stories = storiesByNewest();
    const summary = storiesCatalogSummary(
      stories,
      allTags().length,
      allVehicles().length,
    );

    expect(summary.length).toBeGreaterThan(30);
    expect(summary).toContain(String(stories.length));
    expect(summary).toContain(String(allTags().length));
    expect(summary).toContain(String(allVehicles().length));
  });
});
