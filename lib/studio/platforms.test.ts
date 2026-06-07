import { describe, expect, it } from "vitest";
import {
  listenUrlForStudioPlatform,
  studioPlatforms,
} from "./platforms";

describe("studioPlatforms", () => {
  it("每個平台 id 唯一且 analyticsUrl 非空", () => {
    const platforms = studioPlatforms();
    const ids = platforms.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(platforms.length).toBeGreaterThanOrEqual(6);
    for (const p of platforms) {
      expect(p.analyticsUrl.trim()).not.toBe("");
      expect(p.label.trim()).not.toBe("");
    }
  });

  it("Spotify / Apple 優先排序", () => {
    const ids = studioPlatforms().map((p) => p.id);
    expect(ids[0]).toBe("spotify");
    expect(ids[1]).toBe("apple");
  });

  it("有 listenPlatformLabel 時可對到公開收聽連結", () => {
    const spotify = studioPlatforms().find((p) => p.id === "spotify");
    expect(spotify).toBeDefined();
    const url = listenUrlForStudioPlatform(spotify!);
    expect(url).toContain("spotify.com");
  });
});
