import { describe, expect, it } from "vitest";
import { visiblePlatforms } from "./platforms";

describe("visiblePlatforms", () => {
  it("Spotify、Apple 優先排序", () => {
    const labels = visiblePlatforms().map((p) => p.label);
    expect(labels[0]).toBe("Spotify");
    expect(labels[1]).toBe("Apple Podcasts");
  });
});
