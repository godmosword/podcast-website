import { describe, expect, it } from "vitest";
import type { Story } from "@/data/content";
import { filterStories } from "./story-filtering";

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

  it("filters by tag", () => {
    expect(
      filterStories(stories, { vehicle: null, tag: "勇氣", featuredStorySlug: "ep-12" }).map(
        (s) => s.slug,
      ),
    ).toEqual(["ep-11"]);
  });

  it("combines vehicle and tag filters", () => {
    expect(
      filterStories(stories, {
        vehicle: "警車",
        tag: "合作",
        featuredStorySlug: "ep-12",
      }).map((s) => s.slug),
    ).toEqual(["ep-12"]);
  });
});
