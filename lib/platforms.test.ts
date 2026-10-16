import { describe, expect, it } from "vitest";
import { visiblePlatforms } from "./platforms";

describe("visiblePlatforms", () => {
  it("Apple Podcasts 排第一（Apple 規定並列時排首位），Spotify 第二", () => {
    const labels = visiblePlatforms().map((p) => p.label);
    expect(labels[0]).toBe("Apple Podcasts");
    expect(labels[1]).toBe("Spotify");
  });
});
