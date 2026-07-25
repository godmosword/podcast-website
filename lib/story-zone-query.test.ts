import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStory } from "@/data/content";
import { ZONE_IDS } from "@/data/universe-zones";
import { universe } from "@/data/universe";
import {
  buildZoneStoryPreviewsMap,
  buildZoneStoryPreviewsMapUncached,
  getStoriesByZone,
  zoneStoryTitleLines,
} from "./story-zone-query";

describe("story-zone-query", () => {
  it("getStoriesByZone 回傳對應 zone 的集數", () => {
    const carPark = getStoriesByZone("car-park");
    expect(carPark.length).toBeGreaterThanOrEqual(2);
    expect(carPark.every((s) => s.zoneId === "car-park")).toBe(true);
    expect(carPark.some((s) => s.slug === "ep-1")).toBe(true);
    expect(carPark.some((s) => s.slug === "ep-3")).toBe(true);

    const rescue = getStoriesByZone("rescue");
    expect(rescue.every((s) => s.zoneId === "rescue")).toBe(true);
    expect(rescue.some((s) => s.slug === "ep-6")).toBe(true);
  });

  it("buildZoneStoryPreviewsMap 每 zone 最多 3 筆預覽", () => {
    const map = buildZoneStoryPreviewsMap();
    for (const bundle of Object.values(map)) {
      expect(bundle.previews.length).toBeLessThanOrEqual(3);
      expect(bundle.total).toBeGreaterThanOrEqual(bundle.previews.length);
    }
    expect(map["car-park"].total).toBe(getStoriesByZone("car-park").length);
  });

  it("示範集數 zoneId 可反查", () => {
    expect(getStory("ep-6")?.zoneId).toBe("rescue");
    expect(
      getStoriesByZone("rescue").some((s) => s.title.includes("救護車")),
    ).toBe(true);
  });

  it("zoneStoryTitleLines 與該島故事標題一致", () => {
    const lines = zoneStoryTitleLines("car-park");
    expect(lines.length).toBe(getStoriesByZone("car-park").length);
    expect(lines.every((line) => /^第 \d+ 集：/.test(line))).toBe(true);
  });

  it("五座島的 sr-only 故事區塊文案互不相同且無全站統計句", () => {
    const texts = universe.zones.map((zone) => {
      const titles = zoneStoryTitleLines(zone.id);
      const parts = [
        zone.name,
        zone.tagline,
        zone.childHint ?? "",
        zone.exploreNote ?? "",
        ...titles,
      ];
      return parts.filter(Boolean).join("\n");
    });

    expect(texts).toHaveLength(5);
    expect(new Set(texts).size).toBe(5);
    for (const text of texts) {
      expect(text).not.toContain("車車宇宙共有");
    }
  });
});

describe("buildZoneStoryPreviewsMap React cache", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("cache() 後兩次呼叫只計算一次（counter spy）", async () => {
    vi.doMock("react", async () => {
      const actual = await vi.importActual<typeof import("react")>("react");
      return {
        ...actual,
        cache: <T extends (...args: never[]) => unknown>(fn: T): T => {
          const miss = Symbol("miss");
          let stored: unknown = miss;
          return ((...args: never[]) => {
            if (stored === miss) stored = fn(...args);
            return stored;
          }) as T;
        },
      };
    });

    const content = await import("@/data/content");
    const spy = vi.spyOn(content, "getStories");
    const { buildZoneStoryPreviewsMap: cachedBuild } = await import(
      "./story-zone-query"
    );

    spy.mockClear();
    const first = cachedBuild();
    const second = cachedBuild();

    expect(first).toBe(second);
    expect(spy).toHaveBeenCalledTimes(ZONE_IDS.length);
  });

  it("uncached 與 cached 導出內容一致", () => {
    expect(buildZoneStoryPreviewsMapUncached()).toEqual(
      buildZoneStoryPreviewsMap(),
    );
  });
});
