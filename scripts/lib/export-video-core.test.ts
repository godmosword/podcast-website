import { describe, expect, it } from "vitest";
import {
  assTime,
  buildFfmpegFilterComplex,
  collectSubtitleCharset,
  estimateDurationFromSubtitles,
  normalizeClipDurations,
  resolveAudioDuration,
  resolveSceneClips,
  subtitlesToAss,
} from "./export-video-core";
import type { ScenesFile } from "./illustrate-core";

describe("assTime", () => {
  it("格式化 ASS 時間碼", () => {
    expect(assTime(0)).toBe("0:00:00.00");
    expect(assTime(65.5)).toBe("0:01:05.50");
    expect(assTime(3661.25)).toBe("1:01:01.25");
  });
});

describe("subtitlesToAss", () => {
  it("每句 end 為下一句 t，最後一句到音檔結尾", () => {
    const subs = [
      { t: 0, text: "嗨" },
      { t: 5, text: "Bonbon" },
    ];
    const ass = subtitlesToAss(subs, 10);
    expect(ass).toContain("Dialogue: 0,0:00:00.00,0:00:05.00,Default,,0,0,0,,嗨");
    expect(ass).toContain("Dialogue: 0,0:00:05.00,0:00:10.00,Default,,0,0,0,,Bonbon");
  });
});

describe("resolveAudioDuration", () => {
  it("優先 scenes.audioDuration", () => {
    const scenes = { audioDuration: 120 } as ScenesFile;
    expect(resolveAudioDuration(scenes, [{ t: 0, text: "a" }], 99)).toBe(120);
  });

  it("fallback 字幕估計", () => {
    expect(
      resolveAudioDuration(null, [{ t: 100, text: "a" }], null),
    ).toBe(103);
  });
});

describe("estimateDurationFromSubtitles", () => {
  it("最後一句 t + 3", () => {
    expect(estimateDurationFromSubtitles([{ t: 50, text: "x" }])).toBe(53);
  });
});

describe("normalizeClipDurations", () => {
  it("最後一幕補齊音檔長度", () => {
    const clips = [
      {
        index: 1,
        imagePath: "/a.jpg",
        start: 0,
        end: 10,
        duration: 10,
      },
      {
        index: 2,
        imagePath: "/b.jpg",
        start: 10,
        end: 20,
        duration: 10,
      },
    ];
    const out = normalizeClipDurations(clips, 25);
    expect(out[1].duration).toBe(15);
    expect(out[1].end).toBe(25);
  });
});

describe("resolveSceneClips", () => {
  const scenesFile: ScenesFile = {
    slug: "ep-test",
    audioDuration: 30,
    model: "test",
    generatedAt: "",
    newCharacters: [],
    scenes: [
      {
        index: 1,
        start: 0,
        end: 12,
        summary: "a",
        prompt: "",
        characters: [],
      },
      {
        index: 2,
        start: 12,
        end: 25,
        summary: "b",
        prompt: "",
        characters: [],
      },
    ],
  };

  it("全幕：每幕 duration = end - start 並補齊音檔", () => {
    const clips = resolveSceneClips({
      slug: "ep-9",
      pageCount: 21,
      scenesFile,
      audioDuration: 30,
    });
    expect(clips).toHaveLength(2);
    expect(clips[0].duration).toBe(12);
    expect(clips[1].duration).toBe(18);
    expect(clips[1].imagePath).toContain("02.jpg");
  });
});

describe("collectSubtitleCharset", () => {
  it("收集字幕用字", () => {
    const cs = collectSubtitleCharset([{ t: 0, text: "馬米" }]);
    expect(cs).toContain("馬");
    expect(cs).toContain("米");
  });
});

describe("buildFfmpegFilterComplex", () => {
  it("含 concat 與 subtitles", () => {
    const fc = buildFfmpegFilterComplex(2, "ep-9.ass", "fonts");
    expect(fc).toContain("concat=n=2");
    expect(fc).toContain("subtitles=ep-9.ass:fontsdir=fonts");
  });
});
