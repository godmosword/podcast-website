import { describe, expect, it } from "vitest";
import type { Story } from "@/data/content";
import { searchStories } from "./story-query";

function story(
  slug: string,
  title: string,
  vehicle: string,
  tags: string[] = [],
  summary?: string,
): Story {
  return {
    slug,
    title,
    vehicle,
    kind: "story",
    date: "2026-06-16",
    emoji: "🚗",
    color: "#339af0",
    ep: Number(slug.replace("ep-", "")),
    audio: "audio.mp3",
    pageCount: 1,
    tags,
    ...(summary ? { summary } : {}),
  };
}

describe("searchStories", () => {
  const stories = [
    story("ep-12", "警車的合作任務", "警車", ["合作"], "一起幫助迷路的小車。"),
    story("ep-11", "賽車的勇氣", "賽車", ["勇氣"]),
    story("ep-10", "清潔車的一天", "清潔車", ["好習慣"]),
  ];

  it("搜尋標題、車種、主題與摘要", () => {
    expect(searchStories(stories, "合作").map((item) => item.slug)).toEqual(["ep-12"]);
    expect(searchStories(stories, "賽車").map((item) => item.slug)).toEqual(["ep-11"]);
    expect(searchStories(stories, "迷路").map((item) => item.slug)).toEqual(["ep-12"]);
  });

  it("忽略前後空白與英文字母大小寫", () => {
    const englishStories = [
      story("ep-2", "Robot 故事", "Robot"),
      story("ep-1", "Car 故事", "Car"),
    ];

    expect(searchStories(englishStories, "  robot ")).toEqual([englishStories[0]]);
  });

  it("空白查詢回傳原順序與全部故事", () => {
    expect(searchStories(stories, "   ")).toEqual(stories);
  });
});
