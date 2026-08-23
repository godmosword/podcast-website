import { describe, expect, it } from "vitest";
import {
  isStoryCoverRaster,
  storyPlayCacheUrls,
  storyPlayImageSources,
} from "./story-play-image";

describe("story-play-image", () => {
  it("只把 01.jpg 當封面現代格式", () => {
    expect(isStoryCoverRaster("/stories/ep-3/01.jpg")).toBe(true);
    expect(isStoryCoverRaster("/stories/ep-3/02.jpg")).toBe(false);
    expect(isStoryCoverRaster("/games/v2/hub/hero-desktop.webp")).toBe(false);
  });

  it("封面來源對齊同目錄 avif／webp", () => {
    expect(storyPlayImageSources("/stories/ep-3/01.jpg")).toEqual({
      jpg: "/stories/ep-3/01.jpg",
      webp: "/stories/ep-3/01.webp",
      avif: "/stories/ep-3/01.avif",
    });
  });

  it("CACHE_STORY URL 含音檔、全部 JPG、封面 AVIF／WebP", () => {
    expect(
      storyPlayCacheUrls("/stories/ep-3/audio.mp3", [
        "/stories/ep-3/01.jpg",
        "/stories/ep-3/02.jpg",
      ]),
    ).toEqual([
      "/stories/ep-3/audio.mp3",
      "/stories/ep-3/01.jpg",
      "/stories/ep-3/02.jpg",
      "/stories/ep-3/01.avif",
      "/stories/ep-3/01.webp",
    ]);
  });
});
