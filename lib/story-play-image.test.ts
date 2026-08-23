import { describe, expect, it } from "vitest";
import {
  isStoryCoverRaster,
  isStoryPlayRaster,
  storyIdleCacheUrls,
  storyPlaybackProtectUrls,
  storyPlayImageSources,
} from "./story-play-image";

describe("story-play-image", () => {
  it("只把 01.jpg 當封面現代格式（SW extras）", () => {
    expect(isStoryCoverRaster("/stories/ep-3/01.jpg")).toBe(true);
    expect(isStoryCoverRaster("/stories/ep-3/02.jpg")).toBe(false);
    expect(isStoryCoverRaster("/games/v2/hub/hero-desktop.webp")).toBe(false);
  });

  it("播放頁所有 NN.jpg 都走 picture 現代格式", () => {
    expect(isStoryPlayRaster("/stories/ep-3/01.jpg")).toBe(true);
    expect(isStoryPlayRaster("/stories/ep-3/02.jpg")).toBe(true);
    expect(isStoryPlayRaster("/stories/ep-23/26.jpg")).toBe(true);
    expect(isStoryPlayRaster("/games/v2/hub/hero-desktop.webp")).toBe(false);
  });

  it("封面來源對齊同目錄 avif／webp", () => {
    expect(storyPlayImageSources("/stories/ep-3/01.jpg")).toEqual({
      jpg: "/stories/ep-3/01.jpg",
      webp: "/stories/ep-3/01.webp",
      avif: "/stories/ep-3/01.avif",
    });
    expect(storyPlayImageSources("/stories/ep-3/02.jpg")).toEqual({
      jpg: "/stories/ep-3/02.jpg",
      webp: "/stories/ep-3/02.webp",
      avif: "/stories/ep-3/02.avif",
    });
  });

  it("PLAYBACK_ACTIVE 保護音檔與所有現代格式，但不表示要立刻下載", () => {
    expect(
      storyPlaybackProtectUrls("/stories/ep-3/audio.mp3", [
        "/stories/ep-3/01.jpg",
        "/stories/ep-3/02.jpg",
      ]),
    ).toEqual([
      "/stories/ep-3/audio.mp3",
      "/stories/ep-3/01.jpg",
      "/stories/ep-3/02.jpg",
      "/stories/ep-3/01.avif",
      "/stories/ep-3/01.webp",
      "/stories/ep-3/02.avif",
      "/stories/ep-3/02.webp",
    ]);
  });

  it("CACHE_STORY idle 只排 current±1 以外的 AVIF，不含 MP3／JPG", () => {
    expect(
      storyIdleCacheUrls(
        [
          "/stories/ep-3/01.jpg",
          "/stories/ep-3/02.jpg",
          "/stories/ep-3/03.jpg",
          "/stories/ep-3/04.jpg",
        ],
        0,
      ),
    ).toEqual(["/stories/ep-3/03.avif", "/stories/ep-3/04.avif"]);
    expect(storyIdleCacheUrls(["/stories/ep-26/01.jpg"], 0)).toEqual([]);
  });
});
