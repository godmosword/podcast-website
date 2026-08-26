import { describe, expect, it } from "vitest";
import type { Story } from "@/data/content";
import {
  buildFullTranscriptVtt,
  buildStoryVtt,
  hasFullTranscript,
  hasSceneCaptions,
  hasTranscript,
  hasTranscriptVtt,
  hasVtt,
  llmsTranscriptBullet,
  validateFullTranscript,
} from "./transcript";
import { validateSubtitleSegments } from "./subtitles";

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

describe("hasSceneCaptions", () => {
  it("有 captions 回 true", () => {
    expect(hasSceneCaptions(story({ slug: "ep-1", captions: ["你好"] }))).toBe(
      true,
    );
  });

  it("無 captions 回 false", () => {
    expect(hasSceneCaptions(story({ slug: "ep-1" }))).toBe(false);
  });
});

describe("hasFullTranscript", () => {
  it("僅場景字幕、無 subtitles 側車回 false", () => {
    expect(
      hasFullTranscript(
        story({
          slug: "ep-no-subtitles-fixture",
          captions: ["場景一", "場景二"],
          captionTimes: [0, 5],
        }),
      ),
    ).toBe(false);
  });

  it("ep-1 有 subtitles 側車回 true", () => {
    expect(hasFullTranscript(story({ slug: "ep-1" }))).toBe(true);
  });

  it("ep-27 有草稿字幕側車（完整逐字稿來源）", () => {
    expect(hasFullTranscript("ep-27")).toBe(true);
    const validation = validateFullTranscript("ep-27");
    expect(validation.ok).toBe(true);
  });

  it("hasTranscript／hasVtt／hasTranscriptVtt 與完整逐字稿對齊", () => {
    const withSubs = story({ slug: "ep-1" });
    const withoutSubs = story({
      slug: "ep-no-subtitles-fixture",
      captions: ["a"],
    });
    expect(hasTranscript(withSubs)).toBe(true);
    expect(hasVtt(withSubs)).toBe(true);
    expect(hasTranscriptVtt(withSubs)).toBe(true);
    expect(hasTranscript(withoutSubs)).toBe(false);
    expect(hasVtt(withoutSubs)).toBe(false);
  });
});

describe("validateSubtitleSegments", () => {
  it("拒絕空字幕、空文字、負數與倒退時間", () => {
    const issues = validateSubtitleSegments([
      { t: 2, text: "第一句" },
      { t: 1, text: "第二句" },
      { t: 3, text: "   " },
      { t: -1, text: "負數" },
    ]);

    expect(issues.map((issue) => issue.code)).toEqual([
      "non-monotonic-time",
      "empty-text",
      "negative-time",
      "non-monotonic-time",
    ]);
  });

  it("拒絕超過音檔長度的 cue，並接受現有有效側車", () => {
    expect(
      validateSubtitleSegments([{ t: 11, text: "太晚" }], { audioDuration: 10 }),
    ).toEqual([
      expect.objectContaining({ code: "after-audio" }),
    ]);
    expect(validateFullTranscript("ep-1", { audioDuration: 395 }).ok).toBe(true);
  });
});

describe("buildFullTranscriptVtt", () => {
  it("無 subtitles 回 null（即使有場景 captions）", () => {
    expect(
      buildFullTranscriptVtt(
        story({
          slug: "ep-no-subtitles-fixture",
          captions: ["只有場景"],
          captionTimes: [0],
        }),
      ),
    ).toBeNull();
    expect(buildStoryVtt(story({ slug: "ep-no-subtitles-fixture" }))).toBeNull();
  });

  it("由 subtitles 產出 WEBVTT，cue 數遠多於場景 captions", () => {
    const vtt = buildFullTranscriptVtt("ep-1");
    expect(vtt).not.toBeNull();
    expect(vtt).toMatch(/^WEBVTT/);
    expect(vtt).toContain("嗨,我是 Bonbon");
    const cueCount = (vtt!.match(/^\d+$/gm) ?? []).length;
    expect(cueCount).toBeGreaterThan(50);
  });

  it("負數時間 clamp 為 0（mock slug 用 ep-1 首 cue）", () => {
    const vtt = buildFullTranscriptVtt("ep-1");
    expect(vtt).toContain("00:00:00.000 -->");
  });

  it("連續相同 timestamp 不產生零長度 cue（ep-5）", () => {
    const vtt = buildFullTranscriptVtt("ep-5");
    expect(vtt).not.toBeNull();
    const timeRanges = vtt!.match(
      /\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g,
    );
    expect(timeRanges).toBeDefined();
    for (const range of timeRanges ?? []) {
      const [startStr, endStr] = range.split(" --> ");
      expect(startStr).not.toBe(endStr);
    }
  });
});

describe("llmsTranscriptBullet", () => {
  it("有完整逐字稿標完整逐字稿連結", () => {
    const line = llmsTranscriptBullet(
      story({ slug: "ep-1" }),
      "https://example.com",
    );
    expect(line).toContain("完整逐字稿");
    expect(line).toContain("/transcript.vtt");
  });

  it("僅場景字幕標場景字幕、不稱逐字稿", () => {
    const line = llmsTranscriptBullet(
      story({
        slug: "ep-no-subtitles-fixture",
        captions: ["場景"],
      }),
      "https://example.com",
    );
    expect(line).toContain("場景字幕");
    expect(line).not.toContain("逐字稿");
  });
});
