import { describe, expect, it, vi } from "vitest";
import type { Story } from "@/data/content";
import { filterStories } from "./story-filtering";

vi.mock("@/data/episode-themes", () => ({
  episodeFinderTheme: (slug: string) => {
    if (slug === "ep-11") return "成長勇氣";
    if (slug === "ep-12") return "交友與合作助人";
    return "";
  },
}));

function story(
  slug: string,
  vehicle: string,
  tags: string[] = [],
): Story {
  return {
    slug,
    vehicle,
    kind: "story",
    title: slug,
    date: "2026-06-16",
    emoji: "🚗",
    color: "#339af0",
    ep: Number(slug.replace("ep-", "")),
    audio: "audio.mp3",
    pageCount: 1,
    tags,
  };
}

describe("filterStories", () => {
  const stories = [
    story("ep-12", "警車", ["合作"]),
    story("ep-11", "賽車", ["勇氣"]),
    story("ep-10", "其他", ["成長"]),
  ];

  it("hides the featured latest story when no filter is selected", () => {
    expect(
      filterStories(stories, { vehicle: null, tag: null, featuredStorySlug: "ep-12" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["ep-11", "ep-10"]);
  });

  it("filters by vehicle and keeps featured when it matches", () => {
    expect(
      filterStories(stories, { vehicle: "警車", tag: null, featuredStorySlug: "ep-12" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["ep-12"]);
  });

  it("filters by the episode theme map, not the old tags", () => {
    expect(
      filterStories(stories, { vehicle: null, tag: "成長勇氣", featuredStorySlug: "ep-12" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["ep-11"]);
    expect(
      filterStories(stories, { vehicle: null, tag: "勇氣", featuredStorySlug: "ep-12" }),
    ).toEqual([]);
  });

  it("filters by free-text query", () => {
    expect(
      filterStories(stories, {
        vehicle: null,
        tag: null,
        query: "警車",
        featuredStorySlug: "ep-12",
      }).map((s) => s.slug),
    ).toEqual(["ep-12"]);
  });

  it("combines vehicle and tag filters", () => {
    expect(
      filterStories(stories, {
        vehicle: "警車",
        tag: "交友與合作助人",
        featuredStorySlug: "ep-12",
      }).map((s) => s.slug),
    ).toEqual(["ep-12"]);
  });
});
