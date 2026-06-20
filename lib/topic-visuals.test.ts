import { describe, expect, it } from "vitest";
import { topicVisualFor } from "./topic-visuals";

describe("topicVisualFor", () => {
  it("returns all-topic visual for null", () => {
    expect(topicVisualFor(null).symbol).toBe("all");
  });

  it("maps known tags to symbols", () => {
    expect(topicVisualFor("勇氣").symbol).toBe("star");
    expect(topicVisualFor("成長").symbol).toBe("sprout");
    expect(topicVisualFor("解決問題").symbol).toBe("puzzle");
  });

  it("falls back for unknown tags", () => {
    const v = topicVisualFor("未知主題");
    expect(v.symbol).toBe("bookmark");
    expect(v.bg).toBeTruthy();
    expect(v.fg).toBeTruthy();
  });
});
