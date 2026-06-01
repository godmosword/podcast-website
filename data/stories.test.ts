import { describe, expect, it } from "vitest";
import {
  allTags,
  allVehicles,
  getRelated,
  getStory,
  stories,
  storiesByNewest,
} from "./stories";

describe("getStory", () => {
  it("依 slug 找到故事", () => {
    expect(getStory("ambulance")?.title).toContain("救護車");
  });

  it("未知 slug 回傳 undefined", () => {
    expect(getStory("not-a-story")).toBeUndefined();
  });
});

describe("storiesByNewest", () => {
  it("依 ep 由新到舊排序", () => {
    const sorted = storiesByNewest();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].ep).toBeGreaterThanOrEqual(sorted[i].ep);
    }
  });

  it("不修改原陣列", () => {
    const before = stories.map((s) => s.slug);
    storiesByNewest();
    expect(stories.map((s) => s.slug)).toEqual(before);
  });
});

describe("allVehicles / allTags", () => {
  it("車種去重且非空", () => {
    const vehicles = allVehicles();
    expect(vehicles.length).toBeGreaterThan(0);
    expect(new Set(vehicles).size).toBe(vehicles.length);
  });

  it("標籤去重", () => {
    const tags = allTags();
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe("getRelated", () => {
  it("排除自己", () => {
    const related = getRelated("ambulance");
    expect(related.every((s) => s.slug !== "ambulance")).toBe(true);
  });

  it("優先回傳同標籤或同車種", () => {
    const related = getRelated("ambulance", 1);
    expect(related.length).toBe(1);
  });

  it("未知 slug 回傳空陣列", () => {
    expect(getRelated("missing")).toEqual([]);
  });
});
