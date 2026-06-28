import { describe, expect, it } from "vitest";
import type { Story } from "@/data/content";
import { buildStoryVtt, hasTranscript, hasVtt } from "./transcript";

function story(partial: Partial<Story> & Pick<Story, "slug">): Story {
  return {
    kind: "story",
    slug: partial.slug,
    title: partial.title ?? "測試",
    date: partial.date ?? "2026-01-01",
    ep: partial.ep ?? 1,
    vehicle: partial.vehicle ?? "測試車",
    audio: partial.audio ?? "audio.mp3",
    pageCount: partial.pageCount ?? 1,
    emoji: partial.emoji ?? "🚗",
    color: partial.color ?? "#000",
    captions: partial.captions,
    captionTimes: partial.captionTimes,
  };
}

describe("hasTranscript", () => {
  it("有 captions 回 true", () => {
    expect(hasTranscript(story({ slug: "ep-1", captions: ["你好"] }))).toBe(true);
  });

  it("無 captions 回 false", () => {
    expect(hasTranscript(story({ slug: "ep-1" }))).toBe(false);
  });
});

describe("hasVtt", () => {
  it("captions 與 captionTimes 長度一致回 true", () => {
    expect(
      hasVtt(
        story({
          slug: "ep-1",
          captions: ["a", "b"],
          captionTimes: [0, 2],
        }),
      ),
    ).toBe(true);
  });

  it("長度不一致回 false", () => {
    expect(
      hasVtt(
        story({
          slug: "ep-1",
          captions: ["a", "b"],
          captionTimes: [0],
        }),
      ),
    ).toBe(false);
  });

  it("只有 captions 無 captionTimes 回 false", () => {
    expect(hasTranscript(story({ slug: "ep-1", captions: ["a"] }))).toBe(true);
    expect(hasVtt(story({ slug: "ep-1", captions: ["a"] }))).toBe(false);
  });
});

describe("buildStoryVtt", () => {
  it("產出 WEBVTT 與遞增 cue", () => {
    const vtt = buildStoryVtt(
      story({
        slug: "ep-1",
        captions: ["第一句", "第二句"],
        captionTimes: [1.5, 5],
      }),
    );
    expect(vtt).not.toBeNull();
    expect(vtt).toMatch(/^WEBVTT/);
    expect(vtt).toContain("00:00:01.500 --> 00:00:05.000");
    expect(vtt).toContain("第一句");
    expect(vtt).toContain("00:00:05.000 --> 00:00:09.000");
    expect(vtt).toContain("第二句");
  });

  it("負數時間 clamp 為 0", () => {
    const vtt = buildStoryVtt(
      story({
        slug: "ep-1",
        captions: ["開場"],
        captionTimes: [-1],
      }),
    );
    expect(vtt).toContain("00:00:00.000 -->");
  });

  it("缺時間碼回 null", () => {
    expect(buildStoryVtt(story({ slug: "ep-1", captions: ["只有字"] }))).toBeNull();
  });
});
