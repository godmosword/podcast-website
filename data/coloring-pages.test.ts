import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  COLORING_PAGE_IDS,
  COLORING_PAGES,
  type ColoringPage,
} from "@/data/coloring-pages";

const PUBLIC_DIR = join(process.cwd(), "public");

describe("coloring-pages catalog", () => {
  test("MVP 固定 8 頁：4 定裝 + 4 場景", () => {
    expect(COLORING_PAGES).toHaveLength(8);
    expect(COLORING_PAGES.filter((p) => p.kind === "character")).toHaveLength(4);
    expect(COLORING_PAGES.filter((p) => p.kind === "scene")).toHaveLength(4);
  });

  test("id 唯一且與 COLORING_PAGE_IDS 對齊", () => {
    const ids = COLORING_PAGES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(COLORING_PAGE_IDS).toEqual(ids);
  });

  test("每頁欄位完整、路徑格式正確", () => {
    for (const page of COLORING_PAGES) {
      assertPageShape(page);
      expect(existsSync(join(PUBLIC_DIR, page.sourcePath))).toBe(true);
    }
  });

  test("場景頁覆蓋 car-park / dino / rescue / ocean", () => {
    const zones = COLORING_PAGES.filter((p) => p.kind === "scene").map((p) => p.zoneId);
    expect(new Set(zones)).toEqual(new Set(["car-park", "dino", "rescue", "ocean"]));
  });
});

function assertPageShape(page: ColoringPage): void {
  expect(page.id.length).toBeGreaterThan(0);
  expect(page.title.length).toBeGreaterThan(0);
  expect(["character", "scene"]).toContain(page.kind);
  expect(page.sourcePath).toMatch(/\.(jpe?g)$/i);
  expect(page.lineArtSrc).toBe(`/coloring/${page.id}/line.png`);
  expect(page.previewSrc.startsWith("/")).toBe(true);
  if (page.kind === "scene") {
    expect(page.zoneId).toBeDefined();
  } else {
    expect(page.zoneId).toBeUndefined();
  }
}
