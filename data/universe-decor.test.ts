import { describe, expect, it } from "vitest";
import { MAP_DECOR, MAP_DECOR_BOUNDS } from "./universe-decor";

describe("universe-decor", () => {
  it("MAP_DECOR id 唯一", () => {
    const ids = MAP_DECOR.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("座標落在 MAP_STAGE 內", () => {
    for (const item of MAP_DECOR) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThanOrEqual(MAP_DECOR_BOUNDS.width);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThanOrEqual(MAP_DECOR_BOUNDS.height);
    }
  });

  it("path 類必有 travel", () => {
    for (const item of MAP_DECOR) {
      if (item.motion === "path") {
        expect(item.travel).toBeGreaterThan(0);
      }
    }
  });
});
