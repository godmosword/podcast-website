import { describe, expect, it } from "vitest";
import { resolveUniverseMap } from "@/lib/universe-map";
import {
  MAP_DECOR,
  MAP_DECOR_BOUNDS,
  getMapDecor,
  getMapDecorBounds,
} from "./universe-decor";

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

  it("firefly 為 nightOnly 且 movingOnly", () => {
    const flies = MAP_DECOR.filter((d) => d.kind === "firefly");
    expect(flies.length).toBeGreaterThan(0);
    for (const fly of flies) {
      expect(fly.nightOnly).toBe(true);
      expect(fly.movingOnly).toBe(true);
    }
  });
});

describe("universe-decor 直式（美術審 H3）", () => {
  const items = getMapDecor("portrait");
  const bounds = getMapDecorBounds("portrait");
  const tiles = resolveUniverseMap("portrait").zones.map((z) => z.tileBox);

  it("getMapDecor() 預設就是 MAP_DECOR；直式另一組 id 唯一", () => {
    expect(getMapDecor()).toBe(MAP_DECOR);
    const ids = items.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bounds).toEqual({ width: 720, height: 1400 });
  });

  it("直式填充件在 720×1400 內、不落在任何島 tile 上、path 有 travel", () => {
    for (const item of items) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x).toBeLessThanOrEqual(bounds.width);
      expect(item.y).toBeGreaterThanOrEqual(0);
      expect(item.y).toBeLessThanOrEqual(bounds.height);
      for (const t of tiles) {
        const inside =
          item.x > t.left && item.x < t.left + t.w && item.y > t.top && item.y < t.top + t.h;
        expect(inside, `${item.id} 壓在島 tile 上`).toBe(false);
      }
      if (item.motion === "path") expect(item.travel).toBeGreaterThan(0);
      if (item.kind === "firefly") {
        expect(item.nightOnly).toBe(true);
        expect(item.movingOnly).toBe(true);
      }
    }
  });
});
