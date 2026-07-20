import { describe, expect, it } from "vitest";
import { HOME_PAGE_META_DESCRIPTION, homeSiteIntro } from "./home-geo";

describe("home geo copy", () => {
  it("metadata 與導言非空且含核心定位關鍵字", () => {
    const intro = homeSiteIntro();
    expect(HOME_PAGE_META_DESCRIPTION.length).toBeGreaterThan(20);
    expect(intro.length).toBeGreaterThan(40);
    expect(intro.length).toBeLessThan(120);

    for (const text of [HOME_PAGE_META_DESCRIPTION, intro]) {
      expect(text).toContain("3–7");
      expect(text).toContain("車車");
      expect(text).toMatch(/Podcast|podcast/i);
    }
  });
});
