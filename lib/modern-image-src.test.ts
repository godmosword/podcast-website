import { describe, expect, it } from "vitest";
import {
  landingHeroPictureSources,
  modernRasterPaths,
} from "./modern-image-src";

describe("modern-image-src (D1)", () => {
  it("modernRasterPaths 對齊同目錄 webp／avif", () => {
    expect(modernRasterPaths("/landing/segment-stories.jpg")).toEqual({
      jpg: "/landing/segment-stories.jpg",
      webp: "/landing/segment-stories.webp",
      avif: "/landing/segment-stories.avif",
    });
  });

  it("landingHeroPictureSources 含直版", () => {
    const sources = landingHeroPictureSources(
      "/landing/segment-stories.jpg",
      "/landing/segment-stories-portrait.jpg",
    );
    expect(sources.landscape.webp).toBe("/landing/segment-stories.webp");
    expect(sources.portrait?.avif).toBe("/landing/segment-stories-portrait.avif");
  });
});
