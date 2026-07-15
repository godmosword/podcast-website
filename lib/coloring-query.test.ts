import { describe, expect, test } from "vitest";
import { COLORING_PAGES } from "@/data/coloring-pages";
import {
  getColoringPage,
  listColoringPages,
  listColoringPagesByZone,
} from "@/lib/coloring-query";

describe("coloring-query", () => {
  test("listColoringPages 預設回全部", () => {
    expect(listColoringPages()).toHaveLength(COLORING_PAGES.length);
  });

  test("listColoringPages 可依 kind 篩選", () => {
    expect(listColoringPages("character")).toHaveLength(4);
    expect(listColoringPages("scene")).toHaveLength(4);
    expect(listColoringPages("character").every((p) => p.kind === "character")).toBe(
      true,
    );
  });

  test("getColoringPage 依 id 取值", () => {
    const first = COLORING_PAGES[0];
    expect(getColoringPage(first.id)).toEqual(first);
    expect(getColoringPage("does-not-exist")).toBeUndefined();
  });

  test("listColoringPagesByZone 只回該區場景", () => {
    const dino = listColoringPagesByZone("dino");
    expect(dino.length).toBeGreaterThanOrEqual(1);
    expect(dino.every((p) => p.zoneId === "dino")).toBe(true);
  });
});
