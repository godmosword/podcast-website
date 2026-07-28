import { describe, expect, it } from "vitest";
import { getStory } from "@/data/content";
import { universe, zoneById } from "@/data/universe";
import {
  getFeaturedHotspots,
  hotspotActionHref,
  hotspotById,
  hotspotDetailHref,
  hotspotPath,
  hotspotPrefetchHrefs,
  sortHotspotsForDisplay,
  hotspotToStage,
  resolvedZoneById,
} from "./hotspot";

describe("hotspot helpers（M2/M3）", () => {
  it("hotspotPath / hotspotById", () => {
    expect(hotspotPath("dino", "story-house")).toBe(
      "/adventures/dino/story-house",
    );
    expect(hotspotById("dino", "nope")).toBeNull();
    expect(hotspotById("nope", "x")).toBeNull();
  });

  it("五島熱點皆可解析且座標落在 tileBox 內；id 島內唯一", () => {
    for (const zone of universe.zones) {
      const resolved = resolvedZoneById(zone.id)!;
      const ids = new Set<string>();
      expect(zone.hotspots.length).toBeGreaterThan(0);
      for (const hotspot of zone.hotspots) {
        expect(ids.has(hotspot.id), `${zone.id} 重複 id ${hotspot.id}`).toBe(
          false,
        );
        ids.add(hotspot.id);
        const found = hotspotById(zone.id, hotspot.id);
        expect(found?.hotspot.name).toBe(hotspot.name);
        const pt = hotspotToStage(resolved, hotspot);
        expect(pt.x).toBeGreaterThanOrEqual(resolved.tileBox.left);
        expect(pt.x).toBeLessThanOrEqual(
          resolved.tileBox.left + resolved.tileBox.w,
        );
        expect(pt.y).toBeGreaterThanOrEqual(resolved.tileBox.top);
        expect(pt.y).toBeLessThanOrEqual(
          resolved.tileBox.top + resolved.tileBox.h,
        );
      }
    }
  });

  it("story 型熱點的 slug 皆存在於 content", () => {
    for (const zone of universe.zones) {
      for (const hotspot of zone.hotspots) {
        if (hotspot.action.type !== "story") continue;
        expect(
          getStory(hotspot.action.slug),
          `${zone.id}/${hotspot.id} → ${hotspot.action.slug}`,
        ).toBeTruthy();
      }
    }
  });

  it("prefetch 清單含詳情路徑與動作目標", () => {
    const zone = zoneById("dino")!;
    const hrefs = hotspotPrefetchHrefs(zone);
    expect(hrefs).toContain("/adventures/dino/story-house");
    expect(hrefs).toContain("/story/ep-22");
    expect(hrefs.some((h) => h === "/stories" || h.startsWith("/story/"))).toBe(
      true,
    );
  });

  it("精選地標與探索列排序不改動原始資料", () => {
    const zone = zoneById("dino")!;
    const featured = getFeaturedHotspots(zone.hotspots);
    const ordered = sortHotspotsForDisplay(zone.hotspots);

    expect(featured).toHaveLength(3);
    expect(featured.every((hotspot) => hotspot.featured)).toBe(true);
    expect(ordered.slice(0, 3).every((hotspot) => hotspot.featured)).toBe(true);
    expect(ordered.map((hotspot) => hotspot.id)).toHaveLength(
      zone.hotspots.length,
    );
    expect(zone.hotspots.map((hotspot) => hotspot.id)).toEqual(
      expect.arrayContaining(ordered.map((hotspot) => hotspot.id)),
    );
  });

  it("action href 對齊型別", () => {
    const link = {
      id: "a",
      name: "A",
      featured: false,
      pos: { x: 0.5, y: 0.5 },
      action: { type: "link" as const, href: "/stories" },
    };
    const story = {
      id: "b",
      name: "B",
      featured: false,
      pos: { x: 0.5, y: 0.5 },
      action: { type: "story" as const, slug: "ep-1" },
    };
    const locked = {
      id: "c",
      name: "C",
      featured: false,
      pos: { x: 0.5, y: 0.5 },
      action: { type: "locked" as const, hint: "等等" },
    };
    expect(hotspotActionHref("dino", link)).toBe("/stories");
    expect(hotspotActionHref("dino", story)).toBe("/story/ep-1");
    expect(hotspotActionHref("dino", locked)).toBe("/adventures/dino/c");
    expect(hotspotDetailHref("dino", link)).toBe("/adventures/dino/a");
  });
});
