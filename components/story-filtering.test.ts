import { describe, expect, it } from "vitest";
import type { Story } from "@/data/content";
import { filterStoriesForVehicle } from "./story-filtering";

function story(slug: string, vehicle: string): Story {
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
