import { describe, expect, it } from "vitest";
import { zoneById } from "@/data/universe";
import {
  hotspotActionHref,
  hotspotById,
  hotspotDetailHref,
  hotspotPath,
  hotspotPrefetchHrefs,
  hotspotToStage,
  resolvedZoneById,
} from "./hotspot";

describe("hotspot helpers（M2）", () => {
  it("hotspotPath / hotspotById", () => {
    expect(hotspotPath("dino", "story-house")).toBe(
      "/adventures/dino/story-house",
    );
    expect(hotspotById("dino", "nope")).toBeNull();
    expect(hotspotById("nope", "x")).toBeNull();
  });

  it("dino 種子熱點可解析且座標落在 tileBox 內", () => {
    const zone = zoneById("dino")!;
    expect(zone.hotspots.length).toBeGreaterThanOrEqual(2);
    const resolved = resolvedZoneById("dino")!;
    for (const hotspot of zone.hotspots) {
      const found = hotspotById("dino", hotspot.id);
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
  });

  it("prefetch 清單含詳情路徑與動作目標", () => {
    const zone = zoneById("dino")!;
    const hrefs = hotspotPrefetchHrefs(zone);
    expect(hrefs).toContain("/adventures/dino/story-house");
    expect(hrefs.some((h) => h === "/stories" || h.startsWith("/story/"))).toBe(
      true,
    );
  });

  it("action href 對齊型別", () => {
    const link = {
      id: "a",
      name: "A",
      pos: { x: 0.5, y: 0.5 },
      action: { type: "link" as const, href: "/stories" },
    };
    const story = {
      id: "b",
      name: "B",
      pos: { x: 0.5, y: 0.5 },
      action: { type: "story" as const, slug: "ep-1" },
    };
    const locked = {
      id: "c",
      name: "C",
      pos: { x: 0.5, y: 0.5 },
      action: { type: "locked" as const, hint: "等等" },
    };
    expect(hotspotActionHref("dino", link)).toBe("/stories");
    expect(hotspotActionHref("dino", story)).toBe("/story/ep-1");
    expect(hotspotActionHref("dino", locked)).toBe("/adventures/dino/c");
    expect(hotspotDetailHref("dino", link)).toBe("/adventures/dino/a");
  });
});
