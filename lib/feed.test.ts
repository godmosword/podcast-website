import { describe, expect, it } from "vitest";
import { storiesByNewest } from "@/data/content";
import { buildRssFeed } from "./feed";

describe("buildRssFeed", () => {
  it("產生含 channel 與各集 item 的 RSS", () => {
    const xml = buildRssFeed(storiesByNewest());
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("車車遊樂園");
    expect(xml).toContain("<enclosure");
    expect(xml).toContain("/story/ep-6");
    expect(xml).toContain("audio/mpeg");
  });
});
