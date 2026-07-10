import { describe, expect, it } from "vitest";
import { getStories } from "@/data/content";
import { getParentGuide, listParentGuideSlugs } from "./parent-guides";
import { assertParentGuideDistinctFromFamilyActivity } from "@/lib/geo-content-contract";

describe("parent-guides sidecar", () => {
  it("已定義的 guide 符合契約欄位", () => {
    for (const slug of listParentGuideSlugs()) {
      const guide = getParentGuide(slug);
      expect(guide?.summary.trim().length, slug).toBeGreaterThan(10);
      expect(guide?.prompts.length, slug).toBeGreaterThanOrEqual(1);
    }
  });

  it("與 familyActivity 文案不逐字重複", () => {
    for (const slug of listParentGuideSlugs()) {
      const story = getStories().find((item) => item.slug === slug);
      const guide = getParentGuide(slug);
      expect(story).toBeDefined();
      expect(guide).toBeDefined();
      expect(() =>
        assertParentGuideDistinctFromFamilyActivity(story!, guide!),
      ).not.toThrow();
    }
  });
});
