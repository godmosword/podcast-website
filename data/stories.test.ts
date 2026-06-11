import { describe, expect, it } from "vitest";
import {
  allTags,
  allVehicles,
  getNextStory,
  getRelated,
  getStoriesByTag,
  getStoriesByVehicle,
  getStory,
  stories,
  storiesByNewest,
} from "./content";
import { manualStories } from "./stories";

describe("getStory", () => {
  it("依 slug 找到故事", () => {
    expect(getStory("ep-6")?.title).toContain("救護車");
  });

  it("舊主題 slug 仍可解析", () => {
    expect(getStory("ambulance")?.slug).toBe("ep-6");
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
    const related = getRelated("ep-6");
    expect(related.every((s) => s.slug !== "ep-6")).toBe(true);
  });

  it("優先回傳同標籤或同車種", () => {
    const related = getRelated("ep-6", 1);
    expect(related.length).toBe(1);
  });

  it("未知 slug 回傳空陣列", () => {
    expect(getRelated("missing")).toEqual([]);
  });
});

describe("getNextStory", () => {
  it("回傳下一集（較早 ep）", () => {
    const next = getNextStory("ep-6");
    expect(next?.slug).toBe("ep-5");
  });

  it("最舊一集無下一集", () => {
    expect(getNextStory("ep-1")).toBeUndefined();
  });
});

describe("getStoriesByVehicle", () => {
  it("依車種篩選", () => {
    const list = getStoriesByVehicle("救護車");
    expect(list.every((s) => s.vehicle === "救護車")).toBe(true);
    expect(list.length).toBe(1);
  });
});

describe("getStoriesByTag", () => {
  it("依主題標籤篩選", () => {
    const list = getStoriesByTag("合作");
    expect(list.every((s) => (s.tags ?? []).includes("合作"))).toBe(true);
    expect(list.length).toBe(2);
  });

  it("未知標籤回傳空陣列", () => {
    expect(getStoriesByTag("不存在")).toEqual([]);
  });
});

describe("pageCount", () => {
  it("每集 pageCount 至少為 1", () => {
    expect(stories.every((s) => s.pageCount >= 1)).toBe(true);
  });

  it("手動維護的集數仍為 6 頁插畫", () => {
    expect(manualStories.every((s) => s.pageCount === 6)).toBe(true);
  });
});

describe("slug convention", () => {
  it("手動維護集數使用 ep-N slug", () => {
    expect(manualStories.map((s) => s.slug)).toEqual([
      "ep-6",
      "ep-5",
      "ep-4",
      "ep-3",
      "ep-2",
      "ep-1",
    ]);
  });
});
