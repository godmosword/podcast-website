import { describe, expect, it, vi } from "vitest";
import { storiesByNewest } from "@/data/content";
import { podcastEpisodeJsonLd, podcastSeriesJsonLd } from "./json-ld";

describe("podcastSeriesJsonLd", () => {
  it("產出 PodcastSeries 結構化資料", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const data = podcastSeriesJsonLd();

    expect(data["@type"]).toBe("PodcastSeries");
    expect(data.name).toBe("車車遊樂園");
    expect(data.url).toBe("https://example.com");
    expect(data.webFeed).toBe("https://example.com/feed.xml");
    expect(data.image).toBe("https://example.com/mascot.png");

    vi.unstubAllEnvs();
  });
});

describe("podcastEpisodeJsonLd", () => {
  it("產出 PodcastEpisode 結構化資料", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = storiesByNewest()[0];
    const data = podcastEpisodeJsonLd(story);

    expect(data["@type"]).toBe("PodcastEpisode");
    expect(data.name).toBe(story.title);
    expect(data.url).toBe(`https://example.com/story/${story.slug}`);
    expect(data.episodeNumber).toBe(story.ep);
    expect(data.associatedMedia).toMatchObject({
      "@type": "MediaObject",
      encodingFormat: "audio/mpeg",
    });
    expect(data.partOfSeries).toMatchObject({
      "@type": "PodcastSeries",
      name: "車車遊樂園",
    });
    expect(data).not.toHaveProperty("transcript");

    vi.unstubAllEnvs();
  });

  it("duration 可解析時加 timeRequired", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "12:34" };
    const data = podcastEpisodeJsonLd(story);
    expect(data.timeRequired).toBe("PT12M34S");
    expect(data).not.toHaveProperty("transcript");
    vi.unstubAllEnvs();
  });

  it("duration H:MM:SS 轉 timeRequired", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "1:02:03" };
    const data = podcastEpisodeJsonLd(story);
    expect(data.timeRequired).toBe("PT1H2M3S");
    vi.unstubAllEnvs();
  });

  it("無效 duration 略過 timeRequired", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "bad" };
    const data = podcastEpisodeJsonLd(story);
    expect(data).not.toHaveProperty("timeRequired");
    vi.unstubAllEnvs();
  });
});
