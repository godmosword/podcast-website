import { describe, expect, it } from "vitest";
import type { Story } from "@/data/content";
import {
  filterStoriesForVehicle,
  searchStories,
  normalizeSearchText,
  getVisibleVehicles,
} from "./story-filtering";

function story(
  slug: string,
  vehicle: string,
  extra: Partial<Pick<Story, "title" | "tags">> = {},
): Story {
  return {
    slug,
    vehicle,
    kind: "story",
    title: extra.title ?? slug,
    tags: extra.tags,
    date: "2026-06-16",
    emoji: "🚗",
    color: "#339af0",
    ep: Number(slug.replace("ep-", "")),
    audio: "audio.mp3",
    pageCount: 1,
  };
}

describe("filterStoriesForVehicle", () => {
  const stories = [
    story("ep-12", "警車"),
    story("ep-11", "賽車"),
    story("ep-10", "其他"),
  ];

  it("hides the featured latest story when no vehicle is selected", () => {
    expect(filterStoriesForVehicle(stories, null, "ep-12").map((s) => s.slug))
      .toEqual(["ep-11", "ep-10"]);
  });

  it("keeps the featured latest story when its vehicle is selected", () => {
    expect(filterStoriesForVehicle(stories, "警車", "ep-12").map((s) => s.slug))
      .toEqual(["ep-12"]);
  });
});

describe("normalizeSearchText", () => {
  it("applies NFKC and lowercases and trims", () => {
    expect(normalizeSearchText("　ＥＰ 12 ")).toBe("ep 12");
    expect(normalizeSearchText("WARM")).toBe("warm");
  });
});

describe("searchStories", () => {
  const stories = [
    story("ep-12", "警車", { title: "亮亮警車｜ＥＰ 12", tags: ["勇敢"] }),
    story("ep-11", "賽車", { title: "小紅賽車", tags: ["接受失敗"] }),
    story("ep-10", "其他", { title: "守信用的清潔車", tags: ["守信用"] }),
  ];

  it("hides featured only when query is empty and no vehicle", () => {
    expect(
      searchStories(stories, { featuredStorySlug: "ep-12" }).map((s) => s.slug),
    ).toEqual(["ep-11", "ep-10"]);
  });

  it("can find the featured story once a query is typed", () => {
    expect(
      searchStories(stories, {
        query: "亮亮",
        featuredStorySlug: "ep-12",
      }).map((s) => s.slug),
    ).toEqual(["ep-12"]);
  });

  it("matches title with NFKC-normalized query", () => {
    expect(
      searchStories(stories, { query: "ｅｐ 12" }).map((s) => s.slug),
    ).toEqual(["ep-12"]);
  });

  it("matches by tag", () => {
    expect(
      searchStories(stories, { query: "守信用" }).map((s) => s.slug),
    ).toEqual(["ep-10"]);
  });

  it("matches by vehicle name", () => {
    expect(
      searchStories(stories, { query: "賽車" }).map((s) => s.slug),
    ).toEqual(["ep-11"]);
  });

  it("combines vehicle and query with AND", () => {
    expect(
      searchStories(stories, { query: "勇敢", vehicle: "警車" }).map((s) => s.slug),
    ).toEqual(["ep-12"]);
    expect(
      searchStories(stories, { query: "勇敢", vehicle: "賽車" }),
    ).toEqual([]);
  });

  it("treats whitespace-only query like no query", () => {
    expect(
      searchStories(stories, { query: "   ", featuredStorySlug: "ep-12" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["ep-11", "ep-10"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(searchStories(stories, { query: "火箭" })).toEqual([]);
  });
});

describe("getVisibleVehicles", () => {
  const vehicles = ["挖土機", "警車", "賽車", "其他", "恐龍車", "怪獸卡車", "高鐵", "救護車"];

  it("returns the first N when collapsed", () => {
    expect(getVisibleVehicles(vehicles, null, false, 6)).toEqual(
      vehicles.slice(0, 6),
    );
  });

  it("appends the active vehicle when it is beyond the collapsed window", () => {
    expect(getVisibleVehicles(vehicles, "救護車", false, 6)).toEqual([
      ...vehicles.slice(0, 6),
      "救護車",
    ]);
  });

  it("does not duplicate the active vehicle when already visible", () => {
    expect(getVisibleVehicles(vehicles, "警車", false, 6)).toEqual(
      vehicles.slice(0, 6),
    );
  });

  it("returns all vehicles when expanded", () => {
    expect(getVisibleVehicles(vehicles, null, true, 6)).toEqual(vehicles);
  });
});
